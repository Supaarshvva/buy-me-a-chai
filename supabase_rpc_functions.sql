-- =============================================================
-- RPC FUNCTIONS FOR PUBLIC SUPPORT DATA
-- Run this in Supabase Dashboard → SQL Editor
-- These bypass RLS to expose aggregate/public support data
-- without modifying existing RLS policies.
-- =============================================================

-- 1. Get recent supports for a specific creator (public profile page)
CREATE OR REPLACE FUNCTION get_creator_supports(target_creator_id uuid)
RETURNS TABLE(
  id uuid,
  creator_id uuid,
  supporter_id uuid,
  amount numeric,
  cups integer,
  reference_number text,
  supporter_name text,
  message text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    s.id,
    s.creator_id,
    s.supporter_id,
    s.amount,
    s.cups,
    s.reference_number,
    s.supporter_name,
    s.message,
    s.created_at
  FROM supports s
  WHERE s.creator_id = target_creator_id
  ORDER BY s.created_at DESC;
$$;

-- 2. Get aggregate support counts for all creators (trending leaderboard)
CREATE OR REPLACE FUNCTION get_creator_support_counts()
RETURNS TABLE(
  creator_id uuid,
  supporter_count bigint,
  total_amount numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    s.creator_id,
    COUNT(*) AS supporter_count,
    COALESCE(SUM(s.amount), 0) AS total_amount
  FROM supports s
  GROUP BY s.creator_id;
$$;
