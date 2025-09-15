import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import {
  CityEnum,
  PropertyTypeEnum,
  StatusEnum,
  TimelineEnum,
} from "@/app/lib/validation/buyer.schema";
import SearchFilters from "./_components/SearchFilters";
import ImportExportBar from "./_components/ImportExportBar";

type SearchParams = {
  page?: string;
  q?: string;
  city?: string;
  propertyType?: string;
  status?: string;
  timeline?: string;
};

function parsePage(p?: string) {
  const n = Number(p || 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function pickEnum<T extends readonly [string, ...string[]]>(
  val: string | undefined,
  allowed: T
): T[number] | undefined {
  if (!val) return undefined;
  return (allowed as readonly string[]).includes(val)
    ? (val as T[number])
    : undefined;
}

export default async function BuyersPage({
  searchParams,
}: {
  // In Next 15, searchParams must be awaited
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const take = 10;
  const skip = (page - 1) * take;

  const q = (sp.q || "").trim();
  const city = pickEnum(sp.city, CityEnum.options);
  const propertyType = pickEnum(sp.propertyType, PropertyTypeEnum.options);
  const status = pickEnum(sp.status, StatusEnum.options);
  const timeline = pickEnum(sp.timeline, TimelineEnum.options);

  const where: any = {}; // No owner filtering for fake UUID setup
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

  const [items, total] = await Promise.all([
    prisma.buyer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    }),
    prisma.buyer.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / take));
  const makePageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (city) sp.set("city", city);
    if (propertyType) sp.set("propertyType", propertyType);
    if (status) sp.set("status", status);
    if (timeline) sp.set("timeline", timeline);
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  };

  const timelineLabels: Record<(typeof TimelineEnum.options)[number], string> =
    {
      LT3M: "0-3m",
      M3_TO_6: "3-6m",
      GT6M: ">6m",
      Exploring: "Exploring",
    };

  const statusTone: Record<(typeof StatusEnum.options)[number], string> = {
    New: "bg-blue-50 dark:bg-blue-400/10 text-blue-700 dark:text-blue-300",
    Qualified:
      "bg-indigo-50 dark:bg-indigo-400/10 text-indigo-700 dark:text-indigo-300",
    Contacted:
      "bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300",
    Visited:
      "bg-emerald-50 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
    Negotiation:
      "bg-purple-50 dark:bg-purple-400/10 text-purple-700 dark:text-purple-300",
    Converted:
      "bg-green-50 dark:bg-green-400/10 text-green-700 dark:text-green-300",
    Dropped: "bg-rose-50 dark:bg-rose-400/10 text-rose-700 dark:text-rose-300",
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buyer Leads</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/buyers/new" className="btn btn-primary">
            New Lead
          </Link>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <ImportExportBar />
      </div>

      <div className="card p-4 mb-4">
        <SearchFilters />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 text-xs uppercase">
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Phone</th>
                <th className="text-left px-3 py-2">City</th>
                <th className="text-left px-3 py-2">Property</th>
                <th className="text-left px-3 py-2">Budget</th>
                <th className="text-left px-3 py-2">Timeline</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Updated</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <td className="px-3 py-2 font-medium">{b.fullName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{b.phone}</td>
                  <td className="px-3 py-2">{b.city}</td>
                  <td className="px-3 py-2">{b.propertyType}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {b.budgetMin != null || b.budgetMax != null
                      ? `${b.budgetMin ?? "-"} – ${b.budgetMax ?? "-"}`
                      : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {timelineLabels[b.timeline as any]}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`badge ${statusTone[b.status as any]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(b.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      className="text-blue-700 dark:text-blue-300 underline"
                      href={`/buyers/${b.id}`}
                    >
                      View / Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-gray-600" colSpan={9}>
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page} of {totalPages} · {total} total
        </div>
        <div className="flex gap-2">
          <Link
            href={makePageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`btn btn-ghost ${
              page <= 1 ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            Prev
          </Link>
          <Link
            href={makePageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`btn btn-ghost ${
              page >= totalPages ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
