import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "tvf_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export function getAdminPassword(): {
  password: string;
  isDefault: boolean;
} {
  const configured = process.env.ADMIN_PASSWORD?.trim();
  if (configured && configured.length > 0) {
    return { password: configured, isDefault: false };
  }
  return { password: "admin123", isDefault: true };
}

function getSigningSecret(): string {
  const { password } = getAdminPassword();
  const extra = process.env.ADMIN_SESSION_SECRET?.trim() || "tvf-local-secret-v1";
  return crypto
    .createHash("sha256")
    .update(`${password}::${extra}`)
    .digest("hex");
}

function signPayload(payload: string): string {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
}

export function createAdminSessionToken(nowMs: number = Date.now()): string {
  const expiresAt = Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `admin.${expiresAt}.${nonce}`;
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(
  token: string | undefined | null,
  nowMs: number = Date.now()
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [role, expStr, nonce, providedSig] = parts;
  if (role !== "admin" || !nonce || !providedSig) return false;

  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(nowMs / 1000)) {
    return false;
  }

  const payload = `${role}.${expStr}.${nonce}`;
  const expectedSig = signPayload(payload);

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function verifyAdminPassword(candidate: string): boolean {
  const { password } = getAdminPassword();
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdminApi(): Promise<NextResponse | null> {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    return NextResponse.json(
      { error: "Admin authentication required." },
      { status: 401 }
    );
  }
  return null;
}

function isHttpsRequest(request?: NextRequest): boolean {
  if (!request) {
    return process.env.NODE_ENV === "production";
  }
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }
  return request.nextUrl.protocol === "https:";
}

export function setAdminSessionCookie(
  response: NextResponse,
  request?: NextRequest
): void {
  const token = createAdminSessionToken();
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest(request),
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(
  response: NextResponse,
  request?: NextRequest
): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest(request),
    path: "/",
    maxAge: 0,
  });
}
