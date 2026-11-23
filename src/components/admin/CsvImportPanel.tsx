"use client";

import { useState, type ChangeEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import {
  CSV_SAMPLE_TEMPLATE,
  type CsvRowPreview,
} from "@/lib/admin/csv";
import {
  ALL_PLACES,
  FOLLOWERS_RANGE_OPTIONS,
  LANGUAGE_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
} from "@/lib/constants/taxonomy";

interface CsvImportPanelProps {
  onImported: () => Promise<void>;
}

interface PreviewResponse {
  rows: CsvRowPreview[];
  validCount: number;
  invalidCount: number;
  importedCount?: number;
  skippedCount?: number;
  error?: string;
}

export function CsvImportPanel({ onImported }: CsvImportPanelProps) {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setCsvText(text);
    setPreview(null);
    setSuccessMsg(null);
    setError(null);
  };

  const runImportRequest = async (dryRun: boolean) => {
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, dryRun }),
      });
      const data = (await res.json()) as PreviewResponse;
      if (!res.ok) {
        setError(data.error || "CSV validation failed.");
        if (data.rows) {
          setPreview(data);
        }
        return;
      }

      setPreview(data);
      if (!dryRun) {
        setSuccessMsg(
          `Imported ${data.importedCount ?? 0} creator(s) into PostgreSQL${
            data.skippedCount ? ` (${data.skippedCount} invalid rows skipped)` : ""
          }.`
        );
        await onImported();
      }
    } catch {
      setError("Network error while importing CSV.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 sm:text-lg">
              Bulk Upload Creators via CSV
            </h2>
            <p className="mt-0.5 text-sm text-stone-600">
              Upload a spreadsheet exported as CSV. Use <code>|</code> or{" "}
              <code>;</code> to separate multiple places, travel styles, or
              languages.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/import-csv"
              download="travelvlogfinder-creators-template.csv"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              <Download className="h-4 w-4 text-emerald-700" />
              Download CSV template
            </a>
            <button
              type="button"
              onClick={() => {
                setCsvText(CSV_SAMPLE_TEMPLATE);
                setFileName("sample-kerala-creators.csv");
                setPreview(null);
                setSuccessMsg(null);
                setError(null);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Load sample CSV
            </button>
          </div>
        </div>

        {/* File Picker + Paste Area */}
        <div className="mt-5 space-y-4">
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/70 p-4 text-center transition hover:border-emerald-600 hover:bg-emerald-50/40">
            <Upload className="h-6 w-6 text-emerald-700" />
            <span className="mt-1.5 text-sm font-semibold text-stone-800">
              {fileName
                ? `Selected: ${fileName}`
                : "Tap to choose a .csv file from your device"}
            </span>
            <span className="mt-0.5 text-xs text-stone-500">
              Or paste CSV text directly in the box below
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          <div>
            <label
              htmlFor="csv-raw-textarea"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600"
            >
              CSV Content
            </label>
            <textarea
              id="csv-raw-textarea"
              rows={7}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setPreview(null);
                setSuccessMsg(null);
              }}
              placeholder="name,platform,profile_link,followers_range,region,places_covered,travel_style,budget_min_per_day,budget_max_per_day,min_days,max_days,language,best_known_for,best_season,contact,verified,last_checked"
              className="w-full rounded-xl border border-stone-300 bg-stone-50/60 p-3 font-mono text-xs text-stone-900 focus:border-emerald-700 focus:bg-white focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={busy || !csvText.trim()}
              onClick={() => runImportRequest(true)}
              className="min-h-12 rounded-xl border border-emerald-700 bg-white px-5 text-sm font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
            >
              {busy ? "Checking..." : "Validate & Preview"}
            </button>

            <button
              type="button"
              disabled={busy || !csvText.trim()}
              onClick={() => runImportRequest(false)}
              className="min-h-12 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {busy
                ? "Importing..."
                : preview && preview.validCount > 0
                  ? `Import ${preview.validCount} valid creator(s)`
                  : "Validate & Import now"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {preview && preview.rows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-3.5">
            <h3 className="text-sm font-bold text-stone-900">
              Validation Preview ({preview.rows.length} rows)
            </h3>
            <div className="flex gap-2 text-xs font-bold">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
                {preview.validCount} valid
              </span>
              {preview.invalidCount > 0 && (
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700">
                  {preview.invalidCount} invalid
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {preview.rows.map((row) => (
              <div
                key={row.rowNumber}
                className="flex flex-col gap-1.5 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="mr-2 text-xs font-bold text-stone-400">
                    Row {row.rowNumber}
                  </span>
                  <span className="font-semibold text-stone-900">
                    {row.rawName}
                  </span>
                  {row.data && (
                    <span className="ml-2 text-xs text-stone-500">
                      {row.data.platform} · Rs {row.data.budgetMinPerDay}-
                      {row.data.budgetMaxPerDay}/day ·{" "}
                      {row.data.placesCovered.join(", ")}
                    </span>
                  )}
                  {!row.valid && (
                    <p className="mt-1 text-xs font-medium text-red-700">
                      {row.errors.join(" ")}
                    </p>
                  )}
                </div>
                <span
                  className={`self-start rounded-full px-2.5 py-0.5 text-xs font-bold sm:self-center ${
                    row.valid
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {row.valid ? "Valid" : "Needs fix"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allowed Fixed Values Reference */}
      <details className="rounded-2xl border border-stone-200 bg-white p-4 text-xs text-stone-600">
        <summary className="cursor-pointer font-bold text-stone-800">
          Allowed fixed dropdown values for CSV columns
        </summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p>
            <strong>platform:</strong> youtube, instagram
          </p>
          <p>
            <strong>places_covered:</strong>{" "}
            {ALL_PLACES.map((p) => p.name).join(" | ")}
          </p>
          <p>
            <strong>travel_style:</strong> {TRAVEL_STYLE_OPTIONS.join(" | ")}
          </p>
          <p>
            <strong>language:</strong> {LANGUAGE_OPTIONS.join(" | ")}
          </p>
          <p>
            <strong>followers_range:</strong>{" "}
            {FOLLOWERS_RANGE_OPTIONS.join(" | ")}
          </p>
        </div>
      </details>
    </div>
  );
}
