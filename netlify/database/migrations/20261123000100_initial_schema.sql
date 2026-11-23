-- TravelVlogFinder: Initial PostgreSQL Schema
-- Covers creators, videos, profile_claims, B-tree/GIN indexes, and full-text search indexes.

CREATE TABLE IF NOT EXISTS creators (
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
  contact TEXT NOT NULL DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_checked DATE NOT NULL DEFAULT CURRENT_DATE,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'youtube')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  places TEXT[] NOT NULL DEFAULT '{}',
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  contact TEXT NOT NULL,
  verification_link TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION creators_sync_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.places_covered, ' '), '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.best_known_for, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.region, '')), 'C');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_creators_sync_search_vector ON creators;
CREATE TRIGGER trg_creators_sync_search_vector
  BEFORE INSERT OR UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION creators_sync_search_vector();

CREATE INDEX IF NOT EXISTS idx_creators_region
  ON creators (region);

CREATE INDEX IF NOT EXISTS idx_creators_places_covered_gin
  ON creators USING GIN (places_covered);

CREATE INDEX IF NOT EXISTS idx_creators_budget_range
  ON creators (budget_min_per_day, budget_max_per_day);

CREATE INDEX IF NOT EXISTS idx_creators_days_range
  ON creators (min_days, max_days);

CREATE INDEX IF NOT EXISTS idx_creators_travel_style_gin
  ON creators USING GIN (travel_style);

CREATE INDEX IF NOT EXISTS idx_creators_language_gin
  ON creators USING GIN (language);

CREATE INDEX IF NOT EXISTS idx_creators_platform
  ON creators (platform);

CREATE INDEX IF NOT EXISTS idx_creators_best_known_for_fts
  ON creators USING GIN (to_tsvector('english', coalesce(best_known_for, '')));

CREATE INDEX IF NOT EXISTS idx_creators_search_vector_fts
  ON creators USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_videos_creator_id
  ON videos (creator_id);

CREATE INDEX IF NOT EXISTS idx_videos_places_gin
  ON videos USING GIN (places);

CREATE INDEX IF NOT EXISTS idx_videos_search_vector_fts
  ON videos USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_profile_claims_creator_status
  ON profile_claims (creator_id, status);
