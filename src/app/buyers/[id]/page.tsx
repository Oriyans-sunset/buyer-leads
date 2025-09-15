import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import EditForm from "./EditForm";

export default async function BuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const buyer = await prisma.buyer.findUnique({
    where: { id },
  });
  if (!buyer) return notFound();

  const history = await prisma.buyerHistory.findMany({
    where: { buyerId: id },
    orderBy: { changedAt: "desc" },
    take: 5,
  });

  return (
    <div className="max-w-6xl mx-auto p-6 grid gap-6 md:grid-cols-[1fr_420px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Lead</h1>
          <Link href="/buyers" className="btn btn-ghost">Back to List</Link>
        </div>
        <div className="card p-6">
          <EditForm id={id} initial={buyer as any} />
        </div>
      </div>
      <aside>
        <div className="mb-2">
          <h2 className="text-lg font-semibold">Recent Changes</h2>
        </div>
        <div className="card divide-y overflow-y-auto overflow-x-hidden max-h-[70vh]">
          {history.length === 0 && (
            <div className="p-3 text-sm text-gray-600">No history yet</div>
          )}
          {history.map((h) => (
            <div key={h.id} className="p-3 text-sm">
              <div className="text-gray-500 mb-1">
                {new Date(h.changedAt).toLocaleString()}
              </div>
              <ul className="list-disc pl-4 whitespace-pre-wrap break-words">
                {Array.isArray((h as any).diff) ? (
                  (h as any).diff.map((d: any, i: number) => (
                    <li key={i} className="break-words">
                      <span className="font-medium">{d.field}:</span>{" "}
                      {String(d.from)} -{">"} {String(d.to)}
                    </li>
                  ))
                ) : typeof (h as any).diff === "object" ? (
                  Object.keys((h as any).diff).map((k, i) => (
                    <li key={i} className="break-words">
                      <span className="font-medium">{k}:</span>{" "}
                      {(h as any).diff[k] instanceof Object
                        ? JSON.stringify((h as any).diff[k])
                        : String((h as any).diff[k])}
                    </li>
                  ))
                ) : (
                  <li className="break-words whitespace-pre-wrap">
                    {JSON.stringify((h as any).diff)}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
