// Simple seed script to populate a few Buyer rows
// Uses the generated Prisma client at src/generated/prisma (per schema generator output)
import crypto from "node:crypto";
import {
  PrismaClient,
  City,
  PropertyType,
  BHK,
  Purpose,
  Timeline,
  Source,
  Status,
} from "../src/generated/prisma/index.js";

const seedUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!seedUrl) {
  console.error("Missing DIRECT_URL/DATABASE_URL environment variables.");
  process.exit(1);
}

const prisma = new PrismaClient({
  log: ["error", "warn"],
  datasources: { db: { url: seedUrl } },
});

function uuid() {
  return crypto.randomUUID();
}

async function main() {
  const ownerA = uuid();
  const ownerB = uuid();

  await prisma.buyerHistory.deleteMany();
  await prisma.buyer.deleteMany();

  await prisma.buyer.createMany({
    data: [
      {
        fullName: "Aditi Sharma",
        email: "aditi@example.com",
        phone: "9876543210",
        city: City.Chandigarh,
        propertyType: PropertyType.Apartment,
        bhk: BHK.TWO,
        purpose: Purpose.Buy,
        budgetMin: 4500000,
        budgetMax: 6500000,
        timeline: Timeline.LT3M,
        source: Source.Website,
        status: Status.New,
        notes: "Prefers north-facing, near IT Park.",
        tags: ["hot", "it-employee"],
        ownerId: ownerA,
      },
      {
        fullName: "Rohan Mehta",
        email: "rohan@example.com",
        phone: "9123456789",
        city: City.Mohali,
        propertyType: PropertyType.Villa,
        bhk: BHK.FOUR,
        purpose: Purpose.Buy,
        budgetMin: 15000000,
        budgetMax: 22000000,
        timeline: Timeline.M3_TO_6,
        source: Source.Referral,
        status: Status.Qualified,
        notes: null,
        tags: ["premium"],
        ownerId: ownerA,
      },
      {
        fullName: "Kritika Arora",
        email: null,
        phone: "9012345678",
        city: City.Zirakpur,
        propertyType: PropertyType.Office,
        bhk: null,
        purpose: Purpose.Rent,
        budgetMin: 50000,
        budgetMax: 90000,
        timeline: Timeline.Exploring,
        source: Source.Call,
        status: Status.Contacted,
        notes: "Looking for ~1000 sq ft.",
        tags: ["commercial"],
        ownerId: ownerB,
      },
    ],
  });

  console.log("Seeded buyers. Owners:", { ownerA, ownerB });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
