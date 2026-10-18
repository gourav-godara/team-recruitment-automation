-- =========================================================================
-- Migration 002: Hardened Relational Integrity, Triggers, and Views
-- =========================================================================

-- 1. Fix Foreign Keys to CASCADE on Delete
ALTER TABLE public.runs
    DROP CONSTRAINT IF EXISTS runs_dataset_id_fkey,
    ADD CONSTRAINT runs_dataset_id_fkey
        FOREIGN KEY (dataset_id) REFERENCES public.datasets(id) ON DELETE CASCADE;

ALTER TABLE public.run_results
    DROP CONSTRAINT IF EXISTS run_results_team_id_fkey,
    ADD CONSTRAINT run_results_team_id_fkey
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.run_score_details
    DROP CONSTRAINT IF EXISTS run_score_details_team_id_fkey,
    ADD CONSTRAINT run_score_details_team_id_fkey
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.run_rule_results
    DROP CONSTRAINT IF EXISTS run_rule_results_team_id_fkey,
    ADD CONSTRAINT run_rule_results_team_id_fkey
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.overrides
    DROP CONSTRAINT IF EXISTS overrides_team_id_fkey,
    ADD CONSTRAINT overrides_team_id_fkey
        FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;

-- 2. Add Unique Constraints to Prevent Duplicate Signals & Conflicting Overrides
ALTER TABLE public.member_signals
    DROP CONSTRAINT IF EXISTS uq_member_criterion,
    ADD CONSTRAINT uq_member_criterion UNIQUE (member_id, criterion_key);

ALTER TABLE public.overrides
    DROP CONSTRAINT IF EXISTS uq_run_team_override,
    ADD CONSTRAINT uq_run_team_override UNIQUE (run_id, team_id);

ALTER TABLE public.pairwise_comparisons
    DROP CONSTRAINT IF EXISTS uq_run_pair_comparison,
    ADD CONSTRAINT uq_run_pair_comparison UNIQUE (run_id, team_a_id, team_b_id);

-- 3. High-Performance Composite Indexes
CREATE INDEX IF NOT EXISTS idx_signals_member_criterion 
    ON public.member_signals(member_id, criterion_key);

CREATE INDEX IF NOT EXISTS idx_run_results_rank_score 
    ON public.run_results(run_id, rank, total_score DESC);

CREATE INDEX IF NOT EXISTS idx_teams_dataset_external 
    ON public.teams(dataset_id, external_id);

-- 4. Trigger: Automatically Keep teams.team_size 100% In Sync
CREATE OR REPLACE FUNCTION public.fn_sync_team_size()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.teams
        SET team_size = (SELECT COUNT(*) FROM public.members WHERE team_id = OLD.team_id)
        WHERE id = OLD.team_id;
        RETURN OLD;
    ELSE
        UPDATE public.teams
        SET team_size = (SELECT COUNT(*) FROM public.members WHERE team_id = NEW.team_id)
        WHERE id = NEW.team_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_team_size ON public.members;
CREATE TRIGGER trg_sync_team_size
AFTER INSERT OR UPDATE OF team_id OR DELETE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_team_size();

-- 5. Trigger: Automatically Audit Any Override Changes
CREATE OR REPLACE FUNCTION public.fn_audit_overrides()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (table_name, record_id, action, old_values, new_values, changed_at, changed_by)
    VALUES (
        'overrides',
        COALESCE(NEW.id, OLD.id),
        LOWER(TG_OP),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        NOW(),
        COALESCE(NEW.created_by, OLD.created_by)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_overrides ON public.overrides;
CREATE TRIGGER trg_audit_overrides
AFTER INSERT OR UPDATE OR DELETE ON public.overrides
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_overrides();

-- 6. High-Performance View: Real-Time Hackathon Leaderboard
CREATE OR REPLACE VIEW public.v_leaderboard AS
SELECT 
    rr.run_id,
    rr.rank,
    t.external_id AS team_code,
    t.team_name,
    t.team_size,
    rr.total_score,
    rr.outcome,
    rr.has_missing_data,
    rr.reason AS explanation,
    r.run_at,
    d.name AS dataset_name
FROM public.run_results rr
JOIN public.teams t ON rr.team_id = t.id
JOIN public.runs r ON rr.run_id = r.id
JOIN public.datasets d ON r.dataset_id = d.id
ORDER BY rr.run_id, rr.rank ASC;
