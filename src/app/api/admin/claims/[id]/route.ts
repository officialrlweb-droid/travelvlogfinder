import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { reviewProfileClaim } from "@/lib/admin/repository";

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
    return NextResponse.json({ error: "Invalid claim ID." }, { status: 400 });
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

    const claim = await reviewProfileClaim(id, action);
    if (!claim) {
      return NextResponse.json({ error: "Claim not found." }, { status: 404 });
    }

    return NextResponse.json({ claim });
  } catch (error) {
    console.error("[PATCH /api/admin/claims/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update claim status." },
      { status: 500 }
    );
  }
}
