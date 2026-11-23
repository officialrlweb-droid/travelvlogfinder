import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { CSV_SAMPLE_TEMPLATE, parseCreatorsCsv } from "@/lib/admin/csv";
import { importCreatorsBulk } from "@/lib/admin/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  return new NextResponse(CSV_SAMPLE_TEMPLATE, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="travelvlogfinder-creators-template.csv"',
    },
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      csvText?: string;
      dryRun?: boolean;
    };
    const csvText = String(body.csvText ?? "").trim();
    const dryRun = Boolean(body.dryRun);

    if (!csvText) {
      return NextResponse.json(
        { error: "Please upload or paste a CSV file first." },
        { status: 400 }
      );
    }

    const parsed = parseCreatorsCsv(csvText);
    if (parsed.rows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in CSV." },
        { status: 400 }
      );
    }

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        ...parsed,
      });
    }

    const validInputs = parsed.rows
      .filter((r) => r.valid && r.data)
      .map((r) => r.data!);

    if (validInputs.length === 0) {
      return NextResponse.json(
        {
          error: "No valid rows to import. Please fix the validation errors first.",
          ...parsed,
        },
        { status: 400 }
      );
    }

    const imported = await importCreatorsBulk(validInputs);
    return NextResponse.json(
      {
        dryRun: false,
        importedCount: imported.length,
        skippedCount: parsed.invalidCount,
        creators: imported,
        rows: parsed.rows,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/admin/import-csv] Error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV import." },
      { status: 500 }
    );
  }
}
