"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateBuyerInput,
  createBuyerSchema,
  PropertyTypeEnum,
  BhkEnum,
  CityEnum,
  PurposeEnum,
  TimelineEnum,
  SourceEnum,
  StatusEnum,
  parseTagsInput,
} from "@/app/lib/validation/buyer.schema";

type FormValues = CreateBuyerInput & { tagsInput?: string };

export default function NewBuyerPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(createBuyerSchema),
    defaultValues: {
      city: "Chandigarh",
      propertyType: "Apartment",
      purpose: "Buy",
      timeline: "Exploring",
      source: "Website",
      status: "New",
    },
  });

  const propertyType = watch("propertyType");
  const needsBhk = propertyType === "Apartment" || propertyType === "Villa";

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setCreatedId(null);

    const payload: CreateBuyerInput = {
      ...values,
      email: values.email || undefined,
      notes: values.notes || undefined,
      tags: values.tags ?? parseTagsInput((values as any).tagsInput),
      bhk: needsBhk ? values.bhk : undefined,
      budgetMin: values.budgetMin ?? undefined,
      budgetMax: values.budgetMax ?? undefined,
    };

    const res = await fetch("/api/buyers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(data?.error || "Failed to create lead");
      return;
    }
    const data = await res.json();
    setCreatedId(data.id);
    reset();
  });

  const cityOptions = CityEnum.options;
  const propertyOptions = PropertyTypeEnum.options;
  const bhkOptions = BhkEnum.options;
  const purposeOptions = PurposeEnum.options;
  const timelineOptions = TimelineEnum.options;
  const sourceOptions = SourceEnum.options;
  const statusOptions = StatusEnum.options;

  const timelineLabels: Record<(typeof timelineOptions)[number], string> = {
    LT3M: "0-3m",
    M3_TO_6: "3-6m",
    GT6M: ">6m",
    Exploring: "Exploring",
  };

  const sourceLabels: Record<(typeof sourceOptions)[number], string> = {
    Website: "Website",
    Referral: "Referral",
    Walk_in: "Walk-in",
    Call: "Call",
    Other: "Other",
  };

  const bhkLabels: Record<(typeof bhkOptions)[number], string> = {
    ONE: "1",
    TWO: "2",
    THREE: "3",
    FOUR: "4",
    Studio: "Studio",
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Buyer Lead</h1>

      {serverError && (
        <p className="mb-4 text-red-600" role="alert">
          {serverError}
        </p>
      )}

      {createdId && (
        <p className="mb-4 text-green-700">Created lead with id {createdId}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block font-medium">
            Full Name
          </label>
          <input id="fullName" className="border p-2 w-full" {...register("fullName")} />
          {errors.fullName && (
            <p className="text-red-600 text-sm">{errors.fullName.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block font-medium">
              Email
            </label>
            <input id="email" className="border p-2 w-full" {...register("email")} />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block font-medium">
              Phone
            </label>
            <input id="phone" className="border p-2 w-full" {...register("phone")} />
            {errors.phone && (
              <p className="text-red-600 text-sm">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium">City</label>
            <select className="border p-2 w-full" {...register("city")}> 
              {cityOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium">Property Type</label>
            <select className="border p-2 w-full" {...register("propertyType")}>
              {propertyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {needsBhk && (
            <div>
              <label className="block font-medium">BHK</label>
              <select className="border p-2 w-full" {...register("bhk")}>
                <option value="">Select</option>
                {bhkOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {bhkLabels[opt]}
                  </option>
                ))}
              </select>
              {errors.bhk && (
                <p className="text-red-600 text-sm">{errors.bhk.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium">Purpose</label>
            <select className="border p-2 w-full" {...register("purpose")}>
              {purposeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">Budget Min (INR)</label>
            <input className="border p-2 w-full" type="number" {...register("budgetMin")} />
            {errors.budgetMin && (
              <p className="text-red-600 text-sm">{errors.budgetMin.message}</p>
            )}
          </div>
          <div>
            <label className="block font-medium">Budget Max (INR)</label>
            <input className="border p-2 w-full" type="number" {...register("budgetMax")} />
            {errors.budgetMax && (
              <p className="text-red-600 text-sm">{errors.budgetMax.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium">Timeline</label>
            <select className="border p-2 w-full" {...register("timeline")}>
              {timelineOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {timelineLabels[opt]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">Source</label>
            <select className="border p-2 w-full" {...register("source")}>
              {sourceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {sourceLabels[opt]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium">Status</label>
            <select className="border p-2 w-full" {...register("status")}>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-medium">Notes</label>
          <textarea className="border p-2 w-full" rows={4} {...register("notes")} />
          {errors.notes && (
            <p className="text-red-600 text-sm">{errors.notes.message}</p>
          )}
        </div>

        <div>
          <label className="block font-medium">Tags (comma separated)</label>
          <input className="border p-2 w-full" {...register("tagsInput")} />
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Create Lead"}
        </button>
      </form>
    </div>
  );
}
