import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { deleteVideo, updateVideo } from "@/lib/admin/repository";
import { validateVideoInput } from "@/lib/admin/validation";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid video ID." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateVideoInput(body, { requireCreatorId: false });
    if (!validation.data || validation.errors.length > 0) {
      return NextResponse.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const video = await updateVideo(id, validation.data);
    if (!video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error("[PUT /api/admin/videos/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update video." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid video ID." }, { status: 400 });
  }

  try {
    const removed = await deleteVideo(id);
    if (!removed) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("[DELETE /api/admin/videos/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete video." },
      { status: 500 }
    );
  }
}
