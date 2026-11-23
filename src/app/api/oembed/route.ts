import { NextRequest, NextResponse } from "next/server";
import { fetchOfficialOEmbed } from "@/lib/embeds/official-embed";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  const data = await fetchOfficialOEmbed(url);
  if (!data) {
    return NextResponse.json(
      { error: "Unsupported or invalid YouTube/Instagram video URL." },
      { status: 400 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
