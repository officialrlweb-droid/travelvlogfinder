import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { deleteCreator, updateCreator } from "@/lib/admin/repository";
import { validateCreatorInput } from "@/lib/admin/validation";

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
    return NextResponse.json({ error: "Invalid creator ID." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreatorInput(body);
    if (!validation.data || validation.errors.length > 0) {
      return NextResponse.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const creator = await updateCreator(id, validation.data);
    if (!creator) {
      return NextResponse.json({ error: "Creator not found." }, { status: 404 });
    }

    return NextResponse.json({ creator });
  } catch (error) {
    console.error("[PUT /api/admin/creators/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update creator." },
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
    return NextResponse.json({ error: "Invalid creator ID." }, { status: 400 });
  }

  try {
    const removed = await deleteCreator(id);
    if (!removed) {
      return NextResponse.json({ error: "Creator not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("[DELETE /api/admin/creators/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete creator." },
      { status: 500 }
    );
  }
}
