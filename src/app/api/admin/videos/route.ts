import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { createVideo } from "@/lib/admin/repository";
import { validateVideoInput } from "@/lib/admin/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateVideoInput(body, { requireCreatorId: true });
    if (!validation.data || validation.errors.length > 0) {
      return NextResponse.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const video = await createVideo(validation.data);
    if (!video) {
      return NextResponse.json(
        { error: "Creator not found for this video." },
        { status: 404 }
      );
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/videos] Error:", error);
    return NextResponse.json(
      { error: "Failed to add video." },
      { status: 500 }
    );
  }
}
