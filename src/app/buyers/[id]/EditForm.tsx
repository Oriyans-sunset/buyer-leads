"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateBuyerInput,
  createBuyerSchema,
  CityEnum,
  PropertyTypeEnum,
  BhkEnum,
  PurposeEnum,
  TimelineEnum,
  SourceEnum,
  StatusEnum,
  parseTagsInput,
} from "@/app/lib/validation/buyer.schema";
import { useRouter } from "next/navigation";

type FormValues = CreateBuyerInput & { updatedAt: string; tagsInput?: string };

export default function EditForm({ id, initial }: { id: string; initial: any }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(createBuyerSchema),
    defaultValues: {
      fullName: initial.fullName,
      email: initial.email ?? undefined,
      phone: initial.phone,
      city: initial.city,
      propertyType: initial.propertyType,
      bhk: initial.bhk ?? undefined,
      purpose: initial.purpose,
      budgetMin: initial.budgetMin ?? undefined,
      budgetMax: initial.budgetMax ?? undefined,
      timeline: initial.timeline,
      source: initial.source,
      status: initial.status,
      notes: initial.notes ?? undefined,
      tags: initial.tags ?? [],
      updatedAt: new Date(initial.updatedAt).toISOString(),
    },
  });

  const propertyType = watch("propertyType");
  const needsBhk = propertyType === "Apartment" || propertyType === "Villa";

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const el = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
      el?.focus?.();
    }
  }, [errors]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccess(null);
    const payload: any = {
      ...values,
      email: values.email || undefined,
      notes: values.notes || undefined,
      tags:
        (values as any).tagsInput && (values as any).tagsInput.trim().length > 0
          ? parseTagsInput((values as any).tagsInput)
          : values.tags ?? [],
      bhk: needsBhk ? values.bhk : undefined,
      budgetMin: values.budgetMin ?? undefined,
      budgetMax: values.budgetMax ?? undefined,
    };
    const res = await fetch(`/api/buyers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, updatedAt: watch("updatedAt") }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) setServerError(data?.message || "Record changed, please refresh");
      else setServerError(data?.error || "Failed to update lead");
      return;
    }
    const data = await res.json();
    setSuccess("Saved");
    setValue("updatedAt", new Date(data.updatedAt).toISOString());
    router.refresh();
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
    <form onSubmit={onSubmit} className="space-y-5" aria-describedby={serverError ? 'form-error' : undefined}>
      <input type="hidden" {...register("updatedAt")} />
      <div className="sr-only" aria-live="polite" id="form-error">
        {serverError || Object.values(errors)[0]?.message?.toString()}
      </div>

      {serverError && (
        <p className="text-red-600" role="alert">{serverError}</p>
      )}
      {success && <p className="text-green-700">{success}</p>}

      <div>
        <label htmlFor="fullName" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
          Full Name
        </label>
        <input id="fullName" className="input" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'err-fullName' : undefined} {...register("fullName")} />
        {errors.fullName && (
          <p id="err-fullName" className="text-red-600 text-sm">{errors.fullName.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input id="email" className="input" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'err-email' : undefined} {...register("email")} />
          {errors.email && (
            <p id="err-email" className="text-red-600 text-sm">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input id="phone" className="input" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'err-phone' : undefined} {...register("phone")} />
          {errors.phone && (
            <p id="err-phone" className="text-red-600 text-sm">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">City</label>
          <select className="select" aria-invalid={!!errors.city} {...register("city")}>
            {cityOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Property Type</label>
          <select className="select" aria-invalid={!!errors.propertyType} {...register("propertyType")}>
            {propertyOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {needsBhk && (
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">BHK</label>
            <select className="select" aria-invalid={!!errors.bhk} {...register("bhk")}>
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
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
          <select className="select" aria-invalid={!!errors.purpose} {...register("purpose")}>
            {purposeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Budget Min (INR)</label>
          <input className="input" type="number" aria-invalid={!!errors.budgetMin} {...register("budgetMin")} />
          {errors.budgetMin && (
            <p className="text-red-600 text-sm">{errors.budgetMin.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Budget Max (INR)</label>
          <input className="input" type="number" aria-invalid={!!errors.budgetMax} {...register("budgetMax")} />
          {errors.budgetMax && (
            <p className="text-red-600 text-sm">{errors.budgetMax.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Timeline</label>
          <select className="select" aria-invalid={!!errors.timeline} {...register("timeline")}>
            {timelineOptions.map((opt) => (
              <option key={opt} value={opt}>
                {timelineLabels[opt]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Source</label>
          <select className="select" aria-invalid={!!errors.source} {...register("source")}>
            {sourceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {sourceLabels[opt]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select className="select" aria-invalid={!!errors.status} {...register("status")}>
            {statusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Notes</label>
        <textarea className="textarea" rows={4} aria-invalid={!!errors.notes} {...register("notes")} />
        {errors.notes && (
          <p className="text-red-600 text-sm">{errors.notes.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tags</label>
        <input className="input" defaultValue={(initial.tags || []).join(", ")} {...register("tagsInput")} />
      </div>

      <button
        disabled={isSubmitting}
        type="submit"
        className="btn btn-primary"
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
