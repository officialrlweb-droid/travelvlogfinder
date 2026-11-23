-- TravelVlogFinder: Phase 2 Schema Scaffold
-- Supports official creator OAuth connections, speech-to-text transcripts (Malayalam + English),
-- AI-extracted structured itinerary JSON, and creator review before publishing live.

CREATE TABLE IF NOT EXISTS video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL UNIQUE REFERENCES videos(id) ON DELETE CASCADE,
  source_languages TEXT[] NOT NULL DEFAULT ARRAY['ml', 'en'],
  transcript_text TEXT NOT NULL DEFAULT '',
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_json JSONB,
  review_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (review_status IN ('queued', 'processing', 'pending_review', 'approved', 'rejected')),
  approved_by_creator_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'instagram')),
  external_account_id TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, external_account_id)
);

CREATE INDEX IF NOT EXISTS idx_video_transcripts_video_id
  ON video_transcripts (video_id);

CREATE INDEX IF NOT EXISTS idx_video_transcripts_review_status
  ON video_transcripts (review_status);

CREATE INDEX IF NOT EXISTS idx_video_transcripts_fts
  ON video_transcripts USING GIN (to_tsvector('english', coalesce(transcript_text, '')));

CREATE INDEX IF NOT EXISTS idx_creator_oauth_creator_id
  ON creator_oauth_connections (creator_id);
