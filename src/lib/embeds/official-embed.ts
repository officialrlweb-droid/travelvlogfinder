import type { Platform } from "@/lib/constants/taxonomy";

export interface ParsedEmbed {
  platform: Platform;
  videoId: string;
  embedUrl: string;
  canonicalUrl: string;
  thumbnailUrl?: string;
  isDemoPlaceholder: boolean;
}

export interface OfficialOEmbedResponse {
  available: boolean;
  platform: Platform;
  embedUrl: string;
  canonicalUrl: string;
  title?: string;
  authorName?: string;
  thumbnailUrl?: string;
  html?: string;
  isDemoPlaceholder: boolean;
}

const DEMO_ID_PREFIX = "TVFDEMO";

export function parseOfficialEmbed(
  rawUrl: string,
  fallbackPlatform?: Platform
): ParsedEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  // Official YouTube URL formats: watch?v=, youtu.be/, shorts/, embed/
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com"
  ) {
    let videoId: string | null = null;
    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (
      url.pathname.startsWith("/shorts/") ||
      url.pathname.startsWith("/embed/")
    ) {
      videoId = url.pathname.split("/").filter(Boolean)[1] ?? null;
    }

    if (!videoId || !/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
      return null;
    }

    const isDemoPlaceholder = videoId.startsWith(DEMO_ID_PREFIX);
    return {
      platform: "youtube",
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: isDemoPlaceholder
        ? undefined
        : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      isDemoPlaceholder,
    };
  }

  // Official Instagram URL formats: /p/{code}/, /reel/{code}/, /tv/{code}/
  if (host === "instagram.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    const kind = parts[0];
    const code = parts[1];

    if (
      (kind === "p" || kind === "reel" || kind === "tv") &&
      code &&
      /^[A-Za-z0-9_-]{5,32}$/.test(code)
    ) {
      const isDemoPlaceholder = code.startsWith(DEMO_ID_PREFIX);
      return {
        platform: "instagram",
        videoId: code,
        embedUrl: `https://www.instagram.com/${kind}/${code}/embed/captioned/`,
        canonicalUrl: `https://www.instagram.com/${kind}/${code}/`,
        isDemoPlaceholder,
      };
    }
  }

  if (fallbackPlatform) {
    return null;
  }
  return null;
}

/**
 * Fetches metadata strictly through official oEmbed APIs (no HTML scraping).
 */
export async function fetchOfficialOEmbed(
  rawUrl: string
): Promise<OfficialOEmbedResponse | null> {
  const parsed = parseOfficialEmbed(rawUrl);
  if (!parsed) {
    return null;
  }

  if (parsed.isDemoPlaceholder) {
    return {
      available: false,
      platform: parsed.platform,
      embedUrl: parsed.embedUrl,
      canonicalUrl: parsed.canonicalUrl,
      isDemoPlaceholder: true,
    };
  }

  if (parsed.platform === "youtube") {
    try {
      const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        parsed.canonicalUrl
      )}&format=json`;
      const res = await fetch(endpoint, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) {
        return {
          available: false,
          platform: "youtube",
          embedUrl: parsed.embedUrl,
          canonicalUrl: parsed.canonicalUrl,
          thumbnailUrl: parsed.thumbnailUrl,
          isDemoPlaceholder: false,
        };
      }
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
        html?: string;
      };
      return {
        available: true,
        platform: "youtube",
        embedUrl: parsed.embedUrl,
        canonicalUrl: parsed.canonicalUrl,
        title: data.title,
        authorName: data.author_name,
        thumbnailUrl: data.thumbnail_url ?? parsed.thumbnailUrl,
        html: data.html,
        isDemoPlaceholder: false,
      };
    } catch {
      return {
        available: false,
        platform: "youtube",
        embedUrl: parsed.embedUrl,
        canonicalUrl: parsed.canonicalUrl,
        thumbnailUrl: parsed.thumbnailUrl,
        isDemoPlaceholder: false,
      };
    }
  }

  // Instagram official Meta Graph oEmbed (only when an official app token is configured)
  const metaToken = process.env.META_OEMBED_TOKEN?.trim();
  if (metaToken) {
    try {
      const endpoint = `https://graph.facebook.com/v20.0/instagram_oembed?url=${encodeURIComponent(
        parsed.canonicalUrl
      )}&access_token=${encodeURIComponent(metaToken)}`;
      const res = await fetch(endpoint, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
          html?: string;
        };
        return {
          available: true,
          platform: "instagram",
          embedUrl: parsed.embedUrl,
          canonicalUrl: parsed.canonicalUrl,
          title: data.title,
          authorName: data.author_name,
          thumbnailUrl: data.thumbnail_url,
          html: data.html,
          isDemoPlaceholder: false,
        };
      }
    } catch {
      // Fall through to official iframe embed URL
    }
  }

  return {
    available: true,
    platform: "instagram",
    embedUrl: parsed.embedUrl,
    canonicalUrl: parsed.canonicalUrl,
    isDemoPlaceholder: false,
  };
}
