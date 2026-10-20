-- Migration: 005_anonymous_sessions_and_nullable_auth.sql
-- Description: Refactors schema for public anonymous no-login operation.
--              Makes campaign ownership optional, adds session_id columns across datasets,
--              runs, overrides, and audit log, and adds actor_type to audit_log.
-- Reversible & Additive: Preserves existing tables, constraints, and sample data.

-- 1. Make campaigns.owner_id nullable to allow anonymous or optional campaign creation
ALTER TABLE public.campaigns ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Add session_id to campaigns, datasets, runs, overrides, pairwise_comparisons, and audit_log
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.overrides ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.pairwise_comparisons ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);

-- 3. Add actor_type to audit_log with default 'anonymous'
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS actor_type VARCHAR(32) NOT NULL DEFAULT 'anonymous';

-- 4. High-performance indexes for session-scoped lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_session_id ON public.campaigns(session_id);
CREATE INDEX IF NOT EXISTS idx_datasets_session_id ON public.datasets(session_id);
CREATE INDEX IF NOT EXISTS idx_runs_session_id ON public.runs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_session_id ON public.audit_log(session_id);

-- Rollback script:
-- DROP INDEX IF EXISTS idx_audit_log_session_id;
-- DROP INDEX IF EXISTS idx_runs_session_id;
-- DROP INDEX IF EXISTS idx_datasets_session_id;
-- DROP INDEX IF EXISTS idx_campaigns_session_id;
-- ALTER TABLE public.audit_log DROP COLUMN IF EXISTS actor_type;
-- ALTER TABLE public.audit_log DROP COLUMN IF EXISTS session_id;
-- ALTER TABLE public.pairwise_comparisons DROP COLUMN IF EXISTS session_id;
-- ALTER TABLE public.overrides DROP COLUMN IF EXISTS session_id;
-- ALTER TABLE public.runs DROP COLUMN IF EXISTS session_id;
-- ALTER TABLE public.datasets DROP COLUMN IF EXISTS session_id;
-- ALTER TABLE public.campaigns DROP COLUMN IF EXISTS session_id;
-- ALTER TABLE public.campaigns ALTER COLUMN owner_id SET NOT NULL;
