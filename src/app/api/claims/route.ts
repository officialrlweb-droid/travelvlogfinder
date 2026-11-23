import { NextRequest, NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/lib/db/init";

export const dynamic = "force-dynamic";

interface ClaimPayload {
  creatorId?: string;
  contact?: string;
  verificationLink?: string;
  notes?: string;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ClaimPayload;
    const creatorId = body.creatorId?.trim();
    const contact = body.contact?.trim();
    const verificationLink = body.verificationLink?.trim();
    const notes = body.notes?.trim() ?? "";

    if (!creatorId) {
      return NextResponse.json(
        { error: "Creator ID is required." },
        { status: 400 }
      );
    }
    if (!contact || contact.length < 4) {
      return NextResponse.json(
        { error: "Please enter a valid email, phone, or handle to reach you." },
        { status: 400 }
      );
    }
    if (!verificationLink || !isValidHttpUrl(verificationLink)) {
      return NextResponse.json(
        { error: "Please enter a valid verification URL (https://...)." },
        { status: 400 }
      );
    }

    const db = await ensureDatabaseReady();
    const creatorCheck = await db.query<{ id: string; name: string }>(
      "SELECT id, name FROM creators WHERE id = $1",
      [creatorId]
    );
    if (creatorCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Creator profile not found." },
        { status: 404 }
      );
    }

    const inserted = await db.query<{ id: string; status: string; created_at: string }>(
      `
      INSERT INTO profile_claims (creator_id, contact, verification_link, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, status, created_at
      `,
      [creatorId, contact, verificationLink, notes]
    );

    return NextResponse.json(
      {
        id: inserted.rows[0].id,
        status: inserted.rows[0].status,
        message:
          "Claim submitted! Once an admin reviews and approves your verification link, this profile will display a Verified badge.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/claims] Error:", error);
    return NextResponse.json(
      { error: "Could not submit claim right now." },
      { status: 500 }
    );
  }
}
