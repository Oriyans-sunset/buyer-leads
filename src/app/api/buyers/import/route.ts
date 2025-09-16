import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  createBuyerSchema,
  parseTagsInput,
  CityEnum,
  PropertyTypeEnum,
  BhkEnum,
  PurposeEnum,
  TimelineEnum,
  SourceEnum,
  StatusEnum,
} from "@/app/lib/validation/buyer.schema";
import type { CreateBuyerInput } from "@/app/lib/validation/buyer.schema";

const EXPECTED_HEADERS = [
  "fullName",
  "email",
  "phone",
  "city",
  "propertyType",
  "bhk",
  "purpose",
  "budgetMin",
  "budgetMax",
  "timeline",
  "source",
  "notes",
  "tags",
  "status",
] as const;

type CsvRow = Record<(typeof EXPECTED_HEADERS)[number], string>;

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === ',') {
        cur.push(field);
        field = "";
        i++;
      } else if (ch === '\n') {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
        i++;
      } else if (ch === '\r') {
        // skip CR; handle CRLF
        i++;
      } else if (ch === '"') {
        inQuotes = true;
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  // push last field
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  const headers = rows.shift() || [];
  return { headers, rows };
}

function toNumberOrUndefined(v: string) {
  const s = (v ?? "").trim();
  if (!s) return undefined;
  if (!/^\d+$/.test(s)) return NaN; // invalid
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeRow(raw: CsvRow) {
  return {
    fullName: raw.fullName?.trim() ?? "",
    email: raw.email?.trim() || undefined,
    phone: raw.phone?.trim() ?? "",
    city: raw.city?.trim() as any,
    propertyType: raw.propertyType?.trim() as any,
    bhk: raw.bhk?.trim() ? (raw.bhk.trim() as any) : undefined,
    purpose: raw.purpose?.trim() as any,
    budgetMin: toNumberOrUndefined(raw.budgetMin),
    budgetMax: toNumberOrUndefined(raw.budgetMax),
    timeline: raw.timeline?.trim() as any,
    source: raw.source?.trim() as any,
    notes: raw.notes?.trim() || undefined,
    tags: parseTagsInput(raw.tags),
    status: raw.status?.trim() ? (raw.status.trim() as any) : undefined,
  };
}

function validateHeaders(headers: string[]): string | null {
  if (headers.length !== EXPECTED_HEADERS.length) {
    return `Invalid header length. Expected ${EXPECTED_HEADERS.length} columns.`;
  }
  for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
    if (headers[i] !== EXPECTED_HEADERS[i]) {
      return `Invalid header at position ${i + 1}. Expected '${EXPECTED_HEADERS[i]}'.`;
    }
  }
  return null;
}

function enumHints() {
  return {
    city: CityEnum.options.join(", "),
    propertyType: PropertyTypeEnum.options.join(", "),
    bhk: BhkEnum.options.join(", "),
    purpose: PurposeEnum.options.join(", "),
    timeline: TimelineEnum.options.join(", "),
    source: SourceEnum.options.join(", "),
    status: StatusEnum.options.join(", "),
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let csvText = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") {
        return Response.json({ error: "NoFile" }, { status: 400 });
      }
      const text = await (file as File).text();
      csvText = text;
    } else {
      // allow raw text body
      csvText = await req.text();
    }

    if (!csvText || !csvText.trim()) {
      return Response.json({ error: "EmptyCSV" }, { status: 400 });
    }

    const { headers, rows } = parseCSV(csvText);
    const headerError = validateHeaders(headers);
    if (headerError) {
      return Response.json({ error: "InvalidHeader", message: headerError }, { status: 400 });
    }

    if (rows.length > 200) {
      return Response.json({ error: "TooManyRows", message: "Max 200 rows allowed" }, { status: 400 });
    }

    const errors: { row: number; message: string }[] = [];
    const validData: CreateBuyerInput[] = [];

    const hints = enumHints();

    for (let idx = 0; idx < rows.length; idx++) {
      const rowArr = rows[idx];
      // pad missing columns
      while (rowArr.length < EXPECTED_HEADERS.length) rowArr.push("");
      const rowObj = {} as CsvRow;
      for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
        rowObj[EXPECTED_HEADERS[i]] = rowArr[i] ?? "";
      }
      // numeric coercion validation
      const normalized = normalizeRow(rowObj);
      if (Number.isNaN(normalized.budgetMin as any)) {
        errors.push({ row: idx + 2, message: `budgetMin must be a non-negative integer` });
        continue;
      }
      if (Number.isNaN(normalized.budgetMax as any)) {
        errors.push({ row: idx + 2, message: `budgetMax must be a non-negative integer` });
        continue;
      }

      const parsed = createBuyerSchema.safeParse(normalized);
      if (!parsed.success) {
        const issueMsgs = parsed.error.issues.map((iss) => {
          const path = iss.path?.[0] as string | undefined;
          const code = (iss as any).code as string;
          if ((code === "invalid_value" || code === "invalid_enum_value") && path && (hints as any)[path]) {
            return `${path}: invalid value. Expected one of [${(hints as any)[path]}]`;
          }
          return path ? `${path}: ${iss.message}` : iss.message;
        });
        errors.push({ row: idx + 2, message: issueMsgs.join("; ") });
        continue;
      }
      validData.push(parsed.data);
    }

    let inserted = 0;
    if (validData.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const data of validData) {
          const created = await tx.buyer.create({
            data: {
              fullName: data.fullName,
              email: data.email ?? null,
              phone: data.phone,
              city: data.city as any,
              propertyType: data.propertyType as any,
              bhk: (data.bhk as any) ?? null,
              purpose: data.purpose as any,
              budgetMin: data.budgetMin ?? null,
              budgetMax: data.budgetMax ?? null,
              timeline: data.timeline as any,
              source: data.source as any,
              status: (data.status as any) ?? "New",
              notes: data.notes ?? null,
              tags: data.tags ?? [],
              ownerId: "00000000-0000-0000-0000-000000000000", // keep consistent with current API
            },
          });

          await tx.buyerHistory.create({
            data: {
              buyerId: created.id,
              changedBy: "00000000-0000-0000-0000-000000000000",
              diff: { type: "create", fields: data },
            },
          });
          inserted += 1;
        }
      });
    }

    return Response.json({ inserted, errors });
  } catch (err: any) {
    console.error("POST /api/buyers/import error", err);
    return Response.json({ error: "ServerError" }, { status: 500 });
  }
}
