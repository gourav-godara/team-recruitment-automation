-- Migration 006: Widen members.gender column to VARCHAR(50)
-- Allows full string gender declarations ('Female', 'Male', 'Non-binary', 'Other')
-- while remaining backward-compatible with legacy single-character codes ('F', 'M', 'O').

ALTER TABLE public.members ALTER COLUMN gender TYPE VARCHAR(50);
