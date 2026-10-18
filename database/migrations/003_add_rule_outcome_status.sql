-- Migration: 003_add_rule_outcome_status.sql
-- Description: Extends run_rule_results to support 4-valued deterministic rule outcomes (PASS, FAIL, UNKNOWN, ERROR),
--              rule IDs, advisory/mandatory severity, and structured JSONB evidence.
-- NOTE: Proposed migration. Do NOT execute against live production without review.

-- 1. Add status column with check constraint
ALTER TABLE public.run_rule_results
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PASS' CHECK (status IN ('PASS', 'FAIL', 'UNKNOWN', 'ERROR'));

-- 2. Add rule_id slug column
ALTER TABLE public.run_rule_results
ADD COLUMN IF NOT EXISTS rule_id VARCHAR(100);

-- 3. Add severity column with check constraint
ALTER TABLE public.run_rule_results
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'mandatory' CHECK (severity IN ('mandatory', 'advisory'));

-- 4. Add evidence column for transparent audit trails
ALTER TABLE public.run_rule_results
ADD COLUMN IF NOT EXISTS evidence JSONB;

-- 5. Backfill existing records: if passed is true -> PASS, else -> FAIL
UPDATE public.run_rule_results
SET status = CASE WHEN passed = TRUE THEN 'PASS' ELSE 'FAIL' END
WHERE status IS NULL;

-- 6. Add indexes for efficient reporting and auditing
CREATE INDEX IF NOT EXISTS idx_run_rule_results_run_team ON public.run_rule_results(run_id, team_id);
CREATE INDEX IF NOT EXISTS idx_run_rule_results_status ON public.run_rule_results(status);
CREATE INDEX IF NOT EXISTS idx_run_rule_results_rule_id ON public.run_rule_results(rule_id);

-- Rollback script:
-- ALTER TABLE public.run_rule_results DROP COLUMN IF EXISTS evidence;
-- ALTER TABLE public.run_rule_results DROP COLUMN IF EXISTS severity;
-- ALTER TABLE public.run_rule_results DROP COLUMN IF EXISTS rule_id;
-- ALTER TABLE public.run_rule_results DROP COLUMN IF EXISTS status;
-- DROP INDEX IF EXISTS idx_run_rule_results_rule_id;
-- DROP INDEX IF EXISTS idx_run_rule_results_status;
-- DROP INDEX IF EXISTS idx_run_rule_results_run_team;
