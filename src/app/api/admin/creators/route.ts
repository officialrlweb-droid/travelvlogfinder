import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { createCreator, listAdminCreators } from "@/lib/admin/repository";
import { validateCreatorInput } from "@/lib/admin/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const creators = await listAdminCreators();
    return NextResponse.json({ creators });
  } catch (error) {
    console.error("[GET /api/admin/creators] Error:", error);
    return NextResponse.json(
      { error: "Failed to load creators." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateCreatorInput(body);
    if (!validation.data || validation.errors.length > 0) {
      return NextResponse.json(
        { error: validation.errors[0], errors: validation.errors },
        { status: 400 }
      );
    }

    const creator = await createCreator(validation.data);
    return NextResponse.json({ creator }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/creators] Error:", error);
    return NextResponse.json(
      { error: "Failed to create creator." },
      { status: 500 }
    );
  }
}
