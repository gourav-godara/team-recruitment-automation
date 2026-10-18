-- Migration: 004_supabase_rls_policies.sql
-- Description: Establishes Supabase Row Level Security (RLS) policies for multi-tenant isolation.
-- Enforces that organizers can only view and manage campaigns, datasets, and evaluations they own.
-- NOTE: Proposed migration. Do NOT apply to live production without review.

-- 1. Enable Row Level Security on core tenant tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_score_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_rule_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pairwise_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Campaigns Table Policies (Direct ownership via owner_id)
CREATE POLICY "campaigns_owner_select" ON public.campaigns
    FOR SELECT TO authenticated
    USING (auth.uid() = owner_id);

CREATE POLICY "campaigns_owner_insert" ON public.campaigns
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "campaigns_owner_update" ON public.campaigns
    FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "campaigns_owner_delete" ON public.campaigns
    FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);

-- 3. Datasets Table Policies (Scoped to owned campaign)
CREATE POLICY "datasets_campaign_select" ON public.datasets
    FOR SELECT TO authenticated
    USING (
        campaign_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.campaigns
            WHERE campaigns.id = datasets.campaign_id AND campaigns.owner_id = auth.uid()
        )
    );

CREATE POLICY "datasets_campaign_insert" ON public.datasets
    FOR INSERT TO authenticated
    WITH CHECK (
        campaign_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.campaigns
            WHERE campaigns.id = datasets.campaign_id AND campaigns.owner_id = auth.uid()
        )
    );

CREATE POLICY "datasets_campaign_delete" ON public.datasets
    FOR DELETE TO authenticated
    USING (
        campaign_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.campaigns
            WHERE campaigns.id = datasets.campaign_id AND campaigns.owner_id = auth.uid()
        )
    );

-- 4. Teams, Members, Signals Policies (Derived from Dataset access)
CREATE POLICY "teams_owner_access" ON public.teams
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.datasets
            LEFT JOIN public.campaigns ON campaigns.id = datasets.campaign_id
            WHERE datasets.id = teams.dataset_id
            AND (campaigns.owner_id = auth.uid() OR campaigns.owner_id IS NULL)
        )
    );

CREATE POLICY "members_owner_access" ON public.members
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            JOIN public.datasets ON datasets.id = teams.dataset_id
            LEFT JOIN public.campaigns ON campaigns.id = datasets.campaign_id
            WHERE teams.id = members.team_id
            AND (campaigns.owner_id = auth.uid() OR campaigns.owner_id IS NULL)
        )
    );

-- 5. Runs and Results Policies (Derived from Dataset & Campaign)
CREATE POLICY "runs_owner_access" ON public.runs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.datasets
            LEFT JOIN public.campaigns ON campaigns.id = datasets.campaign_id
            WHERE datasets.id = runs.dataset_id
            AND (campaigns.owner_id = auth.uid() OR campaigns.owner_id IS NULL)
        )
    );

CREATE POLICY "run_results_owner_access" ON public.run_results
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.datasets ON datasets.id = runs.dataset_id
            LEFT JOIN public.campaigns ON campaigns.id = datasets.campaign_id
            WHERE runs.id = run_results.run_id
            AND (campaigns.owner_id = auth.uid() OR campaigns.owner_id IS NULL)
        )
    );

-- 6. Overrides and Audit Trail Policies
CREATE POLICY "overrides_owner_access" ON public.overrides
    FOR ALL TO authenticated
    USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM public.runs
            JOIN public.datasets ON datasets.id = runs.dataset_id
            JOIN public.campaigns ON campaigns.id = datasets.campaign_id
            WHERE runs.id = overrides.run_id AND campaigns.owner_id = auth.uid()
        )
    );

CREATE POLICY "audit_log_owner_select" ON public.audit_log
    FOR SELECT TO authenticated
    USING (auth.uid() = changed_by);

-- Rollback script:
-- DROP POLICY IF EXISTS "audit_log_owner_select" ON public.audit_log;
-- DROP POLICY IF EXISTS "overrides_owner_access" ON public.overrides;
-- DROP POLICY IF EXISTS "run_results_owner_access" ON public.run_results;
-- DROP POLICY IF EXISTS "runs_owner_access" ON public.runs;
-- DROP POLICY IF EXISTS "members_owner_access" ON public.members;
-- DROP POLICY IF EXISTS "teams_owner_access" ON public.teams;
-- DROP POLICY IF EXISTS "datasets_campaign_delete" ON public.datasets;
-- DROP POLICY IF EXISTS "datasets_campaign_insert" ON public.datasets;
-- DROP POLICY IF EXISTS "datasets_campaign_select" ON public.datasets;
-- DROP POLICY IF EXISTS "campaigns_owner_delete" ON public.campaigns;
-- DROP POLICY IF EXISTS "campaigns_owner_update" ON public.campaigns;
-- DROP POLICY IF EXISTS "campaigns_owner_insert" ON public.campaigns;
-- DROP POLICY IF EXISTS "campaigns_owner_select" ON public.campaigns;
-- ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.datasets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.runs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.run_results DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.overrides DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
