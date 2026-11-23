import { NextRequest, NextResponse } from "next/server";
import {
  createCreatorSubmission,
  type SubmissionVideoInput,
} from "@/lib/admin/repository";
import {
  validateCreatorInput,
  validateVideoInput,
} from "@/lib/admin/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const contact = String(body.contact ?? "").trim();
    if (contact.length < 4) {
      return NextResponse.json(
        {
          error: "Please include your contact (email, WhatsApp, or handle) so an admin can verify your submission.",
        },
        { status: 400 }
      );
    }

    const creatorCheck = validateCreatorInput({
      ...body,
      verified: false,
    });
    if (!creatorCheck.data || creatorCheck.errors.length > 0) {
      return NextResponse.json(
        { error: creatorCheck.errors[0], errors: creatorCheck.errors },
        { status: 400 }
      );
    }

    const rawVideos = Array.isArray(body.sampleVideos) ? body.sampleVideos : [];
    const sampleVideos: SubmissionVideoInput[] = [];
    const videoErrors: string[] = [];

    for (let i = 0; i < Math.min(rawVideos.length, 3); i++) {
      const raw = rawVideos[i] as Record<string, unknown>;
      const url = String(raw?.url ?? "").trim();
      const title = String(raw?.title ?? "").trim();
      if (!url && !title) continue;

      const check = validateVideoInput(
        {
          url,
          title,
          platform: raw?.platform || creatorCheck.data.platform,
          description: raw?.description ?? "",
          places: raw?.places ?? creatorCheck.data.placesCovered.slice(0, 1),
        },
        { requireCreatorId: false }
      );
      if (!check.data || check.errors.length > 0) {
        videoErrors.push(`Video #${i + 1}: ${check.errors.join(" ")}`);
      } else {
        sampleVideos.push({
          url: check.data.url,
          platform: check.data.platform,
          title: check.data.title,
          description: check.data.description,
          places: check.data.places,
        });
      }
    }

    if (videoErrors.length > 0) {
      return NextResponse.json(
        { error: videoErrors[0], errors: videoErrors },
        { status: 400 }
      );
    }

    const submission = await createCreatorSubmission(
      creatorCheck.data,
      sampleVideos
    );

    return NextResponse.json(
      {
        id: submission.id,
        status: submission.status,
        message:
          "Thanks for submitting! An admin will review your profile and official video links shortly, and once approved it will appear live with a Verified badge.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/submissions] Error:", error);
    return NextResponse.json(
      { error: "Could not submit your creator page right now." },
      { status: 500 }
    );
  }
}
