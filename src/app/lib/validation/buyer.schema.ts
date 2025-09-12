import { z } from "zod";

export const CityEnum = z.enum([
  "Chandigarh",
  "Mohali",
  "Zirakpur",
  "Panchkula",
  "Other",
]);

export const PropertyTypeEnum = z.enum([
  "Apartment",
  "Villa",
  "Plot",
  "Office",
  "Retail",
]);

export const BhkEnum = z.enum(["ONE", "TWO", "THREE", "FOUR", "Studio"]);

export const PurposeEnum = z.enum(["Buy", "Rent"]);

export const TimelineEnum = z.enum(["LT3M", "M3_TO_6", "GT6M", "Exploring"]);

export const SourceEnum = z.enum([
  "Website",
  "Referral",
  "Walk_in",
  "Call",
  "Other",
]);

export const StatusEnum = z.enum([
  "New",
  "Qualified",
  "Contacted",
  "Visited",
  "Negotiation",
  "Converted",
  "Dropped",
]);

export const buyerBaseSchema = z
  .object({
    fullName: z.string().min(2).max(80),
    email: z
      .string()
      .email()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    phone: z
      .string()
      .min(10)
      .max(15)
      .regex(/^\d{10,15}$/, "Phone must be 10–15 digits"),
    city: CityEnum,
    propertyType: PropertyTypeEnum,
    bhk: BhkEnum.optional(),
    purpose: PurposeEnum,
    budgetMin: z
      .union([
        z.number().int().nonnegative(),
        z.string().regex(/^\d+$/).transform(Number),
      ])
      .optional()
      .transform((v) => (typeof v === "number" ? v : v ?? undefined)),
    budgetMax: z
      .union([
        z.number().int().nonnegative(),
        z.string().regex(/^\d+$/).transform(Number),
      ])
      .optional()
      .transform((v) => (typeof v === "number" ? v : v ?? undefined)),
    timeline: TimelineEnum,
    source: SourceEnum,
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string().trim().min(1)).max(50).optional().default([]),
    status: StatusEnum.optional().default("New"),
  })
  .superRefine((data, ctx) => {
    // budgetMax >= budgetMin when both are present
    if (
      data.budgetMin != null &&
      data.budgetMax != null &&
      data.budgetMax < data.budgetMin
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budgetMax"],
        message: "budgetMax must be greater than or equal to budgetMin",
      });
    }
    // bhk required if Apartment or Villa
    const needsBhk =
      data.propertyType === "Apartment" || data.propertyType === "Villa";
    if (needsBhk && !data.bhk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bhk"],
        message: "BHK is required for Apartment/Villa",
      });
    }
  });

export const createBuyerSchema = buyerBaseSchema;
export type CreateBuyerInput = z.infer<typeof createBuyerSchema>;

// Helper: parse comma separated tags to string[]
export function parseTagsInput(input: string | undefined | null): string[] {
  if (!input) return [];
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );
}
