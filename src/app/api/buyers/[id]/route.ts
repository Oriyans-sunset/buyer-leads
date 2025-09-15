import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createBuyerSchema } from "@/app/lib/validation/buyer.schema";
import { ipFromRequestHeaders, rateLimit } from "@/app/lib/rateLimit";

// Update buyer with optimistic concurrency via updatedAt
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Simple rate limit: 30 updates / minute per IP
    const ip = ipFromRequestHeaders(req.headers);
    const key = `buyers:update:${ip}`;
    const rl = rateLimit(key, 30, 60_000);
    if (!rl.ok) {
      return new Response(JSON.stringify({ error: "RateLimited" }), {
        status: 429,
        headers: rl.retryAfterMs
          ? { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) }
          : undefined,
      });
    }

    const { id } = await params;
    const json = await req.json();
    const { updatedAt: prevUpdatedAtRaw, ...rest } = json || {};

    // Validate the editable fields
    const parsed = createBuyerSchema.safeParse(rest);
    if (!parsed.success) {
      return Response.json(
        { error: "ValidationError", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Parse previous updatedAt for concurrency
    const prevUpdatedAt = prevUpdatedAtRaw ? new Date(prevUpdatedAtRaw) : null;
    if (!prevUpdatedAt || isNaN(prevUpdatedAt.getTime())) {
      return Response.json(
        { error: "BadRequest", message: "Missing updatedAt" },
        { status: 400 }
      );
    }

    // Find current buyer to get its updatedAt
    const currentBuyer = await prisma.buyer.findFirst({
      where: { id },
    });
    if (!currentBuyer) {
      return Response.json({ error: "NotFound" }, { status: 404 });
    }

    // Compute diff of fields
    const fields: (keyof typeof currentBuyer)[] = [
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
      "status",
      "notes",
      "tags",
    ] as any;

    const diff: { field: string; from: any; to: any }[] = [];
    for (const f of fields) {
      const fromVal: any = (currentBuyer as any)[f];
      const toVal: any = (data as any)[f];
      const changed = Array.isArray(fromVal)
        ? JSON.stringify(fromVal) !== JSON.stringify(toVal ?? [])
        : fromVal !== (toVal ?? null);
      if (changed) {
        diff.push({ field: String(f), from: fromVal, to: toVal ?? null });
      }
    }

    // Perform optimistic update
    const result = await prisma.buyer.updateMany({
      where: { id, updatedAt: prevUpdatedAt },
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
      },
    });

    if (result.count === 0) {
      return Response.json(
        { error: "Conflict", message: "Record changed, please refresh" },
        { status: 409 }
      );
    }

    // Fetch new updatedAt to send back
    const updated = await prisma.buyer.findUnique({ where: { id } });

    // Log history if any real changes
    if (diff.length > 0) {
      await prisma.buyerHistory.create({
        data: {
          buyerId: id,
          changedBy: "00000000-0000-0000-0000-000000000000", // fake UUID
          diff: diff,
        },
      });
    }

    return Response.json(
      { id, updatedAt: updated?.updatedAt },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PATCH /api/buyers/[id] error", err);

    // Handle authentication errors
    if (err.message?.includes("Unauthorized")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return Response.json({ error: "ServerError" }, { status: 500 });
  }
}
