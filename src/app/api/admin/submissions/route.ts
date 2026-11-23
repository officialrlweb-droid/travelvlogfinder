import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { listCreatorSubmissions } from "@/lib/admin/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const submissions = await listCreatorSubmissions();
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("[GET /api/admin/submissions] Error:", error);
    return NextResponse.json(
      { error: "Failed to load creator submissions." },
      { status: 500 }
    );
  }
}
