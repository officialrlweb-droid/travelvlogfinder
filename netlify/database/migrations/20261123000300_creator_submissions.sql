-- TravelVlogFinder: Public Creator Self-Submission Queue (MVP+)
-- Creators submit their profile details and up to 3 official YouTube/Instagram links;
-- admins review and publish with one click.

CREATE TABLE IF NOT EXISTS creator_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube')),
  profile_link TEXT NOT NULL,
  followers_range TEXT NOT NULL,
  region TEXT NOT NULL,
  places_covered TEXT[] NOT NULL DEFAULT '{}',
  travel_style TEXT[] NOT NULL DEFAULT '{}',
  budget_min_per_day INTEGER NOT NULL CHECK (budget_min_per_day >= 0),
  budget_max_per_day INTEGER NOT NULL CHECK (budget_max_per_day >= budget_min_per_day),
  min_days INTEGER NOT NULL CHECK (min_days >= 1),
  max_days INTEGER NOT NULL CHECK (max_days >= min_days),
  language TEXT[] NOT NULL DEFAULT '{}',
  best_known_for TEXT NOT NULL DEFAULT '',
  best_season TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL,
  sample_videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_submissions_status
  ON creator_submissions (status, created_at DESC);
