import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { listProfileClaims } from "@/lib/admin/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const claims = await listProfileClaims();
    return NextResponse.json({ claims });
  } catch (error) {
    console.error("[GET /api/admin/claims] Error:", error);
    return NextResponse.json(
      { error: "Failed to load profile claims." },
      { status: 500 }
    );
  }
}
