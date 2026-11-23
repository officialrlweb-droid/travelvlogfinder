import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  getAdminPassword,
  isAdminAuthenticated,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  const { isDefault } = getAdminPassword();
  return NextResponse.json({
    authenticated,
    usingDefaultPassword: isDefault,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = String(body.password ?? "");

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: "Invalid admin password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ authenticated: true });
    setAdminSessionCookie(response, request);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ authenticated: false });
  clearAdminSessionCookie(response, request);
  return response;
}
