import {
  validateCreatorInput,
  type CreatorMutationInput,
} from "./validation";

export interface CsvRowPreview {
  rowNumber: number;
  rawName: string;
  valid: boolean;
  data?: CreatorMutationInput;
  errors: string[];
}

export interface CsvParseResult {
  headers: string[];
  rows: CsvRowPreview[];
  validCount: number;
  invalidCount: number;
}

export const CSV_TEMPLATE_HEADERS = [
  "name",
  "platform",
  "profile_link",
  "followers_range",
  "region",
  "places_covered",
  "travel_style",
  "budget_min_per_day",
  "budget_max_per_day",
  "min_days",
  "max_days",
  "language",
  "best_known_for",
  "best_season",
  "contact",
  "verified",
  "last_checked",
] as const;

export const CSV_SAMPLE_TEMPLATE = `${CSV_TEMPLATE_HEADERS.join(",")}
"Wayanad Cloud Trails (Anand V)",youtube,https://www.youtube.com/@wayanadcloudtrails,"10K - 50K","Kerala, India","Wayanad|Kozhikode","Budget & Backpacking|Adventure & Trekking",1300,2300,2,4,"Malayalam|English","Budget homestays near Vythiri, Chembra Peak trek permits, and monsoon waterfall drives.","Oct - Feb (Winter & Peak)",anand.trails@example.com,false,2026-11-20
"Alleppey Slow Boats (Nisha Thomas)",instagram,https://www.instagram.com/alleppeyslowboats/,"50K - 100K","Kerala, India","Alleppey|Kochi|Varkala","Slow Travel & Cafes|Couple & Honeymoon",2200,3600,2,5,"English|Malayalam","Honest shikara vs houseboat price comparisons and quiet canal stays.","Oct - Feb (Winter & Peak)",nisha.boats@example.com,true,2026-11-20
`;

/**
 * RFC 4180 compliant CSV parser (supports quoted fields, embedded commas, escaped quotes, CRLF/LF).
 */
export function parseCsvMatrix(csvText: string): string[][] {
  const input = csvText.replace(/^\uFEFF/, ""); // Strip UTF-8 BOM
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\r" && next === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
    } else if (ch === "\n" || ch === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function splitListField(value: string): string[] {
  return value
    .split(/[|;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseCreatorsCsv(csvText: string): CsvParseResult {
  const matrix = parseCsvMatrix(csvText);
  if (matrix.length === 0) {
    return { headers: [], rows: [], validCount: 0, invalidCount: 0 };
  }

  const headers = matrix[0].map((h) => h.trim().toLowerCase());
  const dataRows = matrix.slice(1);
  const rows: CsvRowPreview[] = [];

  dataRows.forEach((cols, idx) => {
    const rowNumber = idx + 2; // 1-indexed including header row
    const record: Record<string, unknown> = {};

    headers.forEach((header, colIdx) => {
      const val = (cols[colIdx] ?? "").trim();
      if (
        header === "places_covered" ||
        header === "travel_style" ||
        header === "language" ||
        header === "languages"
      ) {
        record[header] = splitListField(val);
      } else {
        record[header] = val;
      }
    });

    const validation = validateCreatorInput(record);
    rows.push({
      rowNumber,
      rawName: String(record.name ?? "").trim() || `(Row ${rowNumber})`,
      valid: validation.errors.length === 0 && Boolean(validation.data),
      data: validation.data,
      errors: validation.errors,
    });
  });

  const validCount = rows.filter((r) => r.valid).length;
  return {
    headers,
    rows,
    validCount,
    invalidCount: rows.length - validCount,
  };
}
