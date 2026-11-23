"use client";

import { useState } from "react";
import { ExternalLink, MapPin, Play, Video, X } from "lucide-react";
import {
  parseOfficialEmbed,
  type OfficialOEmbedResponse,
} from "@/lib/embeds/official-embed";
import type { FeaturedVideo } from "@/lib/search/types";
import { PlatformIcon } from "./PlatformIcon";

interface VideoEmbedCardProps {
  video: FeaturedVideo;
}

export function VideoEmbedCard({ video }: VideoEmbedCardProps) {
  const parsed = parseOfficialEmbed(video.url, video.platform);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [oembedInfo, setOembedInfo] = useState<OfficialOEmbedResponse | null>(null);
  const [loadingEmbed, setLoadingEmbed] = useState(false);

  const handleOpenEmbed = async () => {
    setEmbedOpen(true);
    if (!oembedInfo && parsed && !parsed.isDemoPlaceholder) {
      setLoadingEmbed(true);
      try {
        const res = await fetch(
          `/api/oembed?url=${encodeURIComponent(video.url)}`
        );
        if (res.ok) {
          const data = (await res.json()) as OfficialOEmbedResponse;
          setOembedInfo(data);
        }
      } catch {
        // Fallback to direct official iframe URL
      } finally {
        setLoadingEmbed(false);
      }
    }
  };

  const embedUrl = oembedInfo?.embedUrl ?? parsed?.embedUrl ?? null;
  const thumbnailUrl = oembedInfo?.thumbnailUrl ?? parsed?.thumbnailUrl;
  const isDemo = parsed?.isDemoPlaceholder ?? false;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-stone-50/70 transition hover:border-stone-300">
      {embedOpen && embedUrl ? (
        <div className="relative bg-stone-950">
          <div className="flex items-center justify-between bg-stone-900 px-3 py-1.5 text-xs text-stone-200">
            <span className="flex items-center gap-1.5 font-medium">
              <PlatformIcon platform={video.platform} className="h-3.5 w-3.5" />
              Official {video.platform === "youtube" ? "YouTube" : "Instagram"} Embed
            </span>
            <button
              type="button"
              onClick={() => setEmbedOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-300 hover:bg-stone-800 hover:text-white"
              aria-label="Close embedded player"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isDemo ? (
            <div className="flex min-h-[190px] flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 p-5 text-center text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
                <Video className="h-5 w-5 text-emerald-300" />
              </div>
              <p className="text-sm font-semibold">Sample Seed Video Link</p>
              <p className="max-w-xs text-xs leading-relaxed text-stone-300">
                This seeded creator uses a sample URL. Any real YouTube or
                Instagram URL added in Admin renders live inside the official{" "}
                {video.platform === "youtube"
                  ? "youtube-nocookie.com/embed"
                  : "instagram.com/.../embed"}{" "}
                player here.
              </p>
              <code className="max-w-full truncate rounded bg-black/40 px-2.5 py-1 text-[11px] text-emerald-200">
                {embedUrl}
              </code>
            </div>
          ) : loadingEmbed ? (
            <div className="flex aspect-video items-center justify-center text-xs text-stone-300">
              Loading official embed...
            </div>
          ) : (
            <div
              className={
                video.platform === "youtube"
                  ? "aspect-video w-full"
                  : "h-[360px] w-full bg-white"
              }
            >
              <iframe
                src={embedUrl}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpenEmbed}
          className="group relative flex min-h-24 w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-800 p-3.5 text-left text-white transition hover:brightness-105 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
        >
          {thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt={video.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-300 group-hover:scale-105"
            />
          )}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
              <PlatformIcon platform={video.platform} className="h-3.5 w-3.5" />
              {video.platform === "youtube" ? "YouTube" : "Instagram Reel"}
            </span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-900 shadow-md transition group-hover:scale-105">
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            </span>
          </div>
          <div className="relative z-10 mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-100">
            <span>Tap to load official embed</span>
          </div>
        </button>
      )}

      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
            {video.title}
          </h4>
          {video.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
              {video.description}
            </p>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/70">
          <div className="flex flex-wrap gap-1">
            {video.places.slice(0, 2).map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-0.5 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600 ring-1 ring-stone-200"
              >
                <MapPin className="h-3 w-3 text-emerald-700" />
                {p}
              </span>
            ))}
          </div>

          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
