import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { reviewCreatorSubmission } from "@/lib/admin/repository";

export const dynamic = "force-dynamic";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: "Invalid submission ID." },
      { status: 400 }
    );
  }

  try {
    const body = (await request.json()) as { action?: string };
    const action = body.action;
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'." },
        { status: 400 }
      );
    }

    const result = await reviewCreatorSubmission(id, action);
    if (!result) {
      return NextResponse.json(
        { error: "Submission not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PATCH /api/admin/submissions/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to review submission." },
      { status: 500 }
    );
  }
}
