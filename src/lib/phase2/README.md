# Phase 2 Blueprint (Prepared, Not Yet Active)

The codebase and database schema are pre-structured so Phase 2 drops in without rewrites:

1. **Official Creator OAuth (`creator_oauth_connections`)**
   - Creators authenticate with YouTube Data API v3 / Instagram Graph API via official OAuth 2.0 (never scraping).
   - Tokens and scopes are stored per creator in `creator_oauth_connections`.

2. **Background Audio -> Speech-to-Text -> AI Extraction (`video_transcripts`)**
   - Queue worker processes creator-approved videos.
   - Speech-to-text transcribes Malayalam (`ml`) and English (`en`) audio and saves timestamped `segments` + `transcript_text` in `video_transcripts`.
   - Structured LLM extractor outputs `extracted_json` (`places`, `estimatedDays`, `estimatedDailyBudgetInr`, `costBreakdownNotes`, `tips`) mapped against canonical values in `src/lib/constants/taxonomy.ts`.

3. **Creator Review & Publish Gate**
   - Extracted records stay in `review_status = 'pending_review'` until the creator reviews, edits, and approves them.
   - Upon approval (`review_status = 'approved'`), verified metadata syncs to `creators` and `videos`, and `video_transcripts` becomes searchable via `idx_video_transcripts_fts`.
