import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createBuyerSchema } from "@/app/lib/validation/buyer.schema";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = createBuyerSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "ValidationError", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Placeholder owner until auth is wired. Must be a valid UUID.
    const ownerId = "00000000-0000-0000-0000-000000000000";

    const created = await prisma.buyer.create({
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
        ownerId,
      },
    });

    await prisma.buyerHistory.create({
      data: {
        buyerId: created.id,
        changedBy: ownerId,
        diff: {
          type: "create",
          fields: data,
        },
      },
    });

    return Response.json({ id: created.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/buyers error", err);
    return Response.json({ error: "ServerError" }, { status: 500 });
  }
}
