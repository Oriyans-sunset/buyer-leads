import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  CityEnum,
  PropertyTypeEnum,
  StatusEnum,
  TimelineEnum,
} from "@/app/lib/validation/buyer.schema";

function pickEnum<T extends readonly [string, ...string[]]>(
  val: string | undefined,
  allowed: T
): T[number] | undefined {
  if (!val) return undefined;
  return (allowed as readonly string[]).includes(val)
    ? (val as T[number])
    : undefined;
}

function buildWhere(sp: URLSearchParams) {
  const q = (sp.get("q") || "").trim();
  const city = pickEnum(sp.get("city") || undefined, CityEnum.options);
  const propertyType = pickEnum(
    sp.get("propertyType") || undefined,
    PropertyTypeEnum.options
  );
  const status = pickEnum(sp.get("status") || undefined, StatusEnum.options);
  const timeline = pickEnum(
    sp.get("timeline") || undefined,
    TimelineEnum.options
  );
  const where: any = {};
  if (city) where.city = city;
  if (propertyType) where.propertyType = propertyType;
  if (status) where.status = status;
  if (timeline) where.timeline = timeline;
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

function csvEscape(value: any): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const HEADERS = [
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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const where = buildWhere(url.searchParams);

    const items = await prisma.buyer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    const rows: string[] = [];
    rows.push(HEADERS.join(","));
    for (const b of items) {
      const tags = Array.isArray(b.tags) ? b.tags.join(",") : "";
      const row = [
        b.fullName,
        b.email ?? "",
        b.phone,
        b.city,
        b.propertyType,
        b.bhk ?? "",
        b.purpose,
        b.budgetMin ?? "",
        b.budgetMax ?? "",
        b.timeline,
        b.source,
        b.notes ?? "",
        tags,
        b.status,
      ].map(csvEscape);
      rows.push(row.join(","));
    }

    const body = rows.join("\r\n");
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=buyers-export.csv`,
      },
    });
  } catch (err: any) {
    console.error("GET /api/buyers/export error", err);
    return new Response("Server error", { status: 500 });
  }
}

