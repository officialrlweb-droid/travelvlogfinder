/**
 * Phase 2 Architecture Contracts (Not wired into live UI yet).
 *
 * Planned flow:
 * 1. Creators connect YouTube / Instagram via official OAuth.
 * 2. Background job fetches authorized audio / captions for creator-selected videos.
 * 3. Speech-to-text transcribes Malayalam ('ml') and English ('en') into `video_transcripts`.
 * 4. An AI extractor parses places, costs, days, and tips into structured JSON.
 * 5. Creator reviews and approves the extracted JSON before it updates their live profile.
 */

export type OAuthProvider = "youtube" | "instagram";

export type TranscriptReviewStatus =
  | "queued"
  | "processing"
  | "pending_review"
  | "approved"
  | "rejected";

export interface TranscriptSegment {
  startSec: number;
  endSec: number;
  language: "ml" | "en" | "mixed";
  text: string;
}

export interface ExtractedItineraryData {
  places: string[];
  estimatedDays: {
    min: number;
    max: number;
  };
  estimatedDailyBudgetInr: {
    min: number;
    max: number;
    includesStayFoodLocalTravelOnly: boolean;
  };
  costBreakdownNotes: string[];
  tips: string[];
  bestSeason?: string;
}

export interface VideoTranscriptRecord {
  id: string;
  videoId: string;
  sourceLanguages: ("ml" | "en")[];
  transcriptText: string;
  segments: TranscriptSegment[];
  extractedJson: ExtractedItineraryData | null;
  reviewStatus: TranscriptReviewStatus;
  approvedByCreatorAt: string | null;
}

export interface CreatorOAuthService {
  getAuthorizationUrl(provider: OAuthProvider, state: string): string;
  exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string
  ): Promise<{ externalAccountId: string; scopes: string[]; expiresAt: Date | null }>;
}

export interface VideoIngestionPipeline {
  enqueueVideoTranscription(videoId: string): Promise<{ jobId: string }>;
  runSpeechToText(audioRef: string, languages: ("ml" | "en")[]): Promise<{
    transcriptText: string;
    segments: TranscriptSegment[];
  }>;
  extractStructuredItinerary(transcriptText: string): Promise<ExtractedItineraryData>;
  approveExtractedReview(
    transcriptId: string,
    creatorOverrides?: Partial<ExtractedItineraryData>
  ): Promise<void>;
}
