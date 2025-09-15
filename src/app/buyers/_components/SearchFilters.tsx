"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CityEnum,
  PropertyTypeEnum,
  StatusEnum,
  TimelineEnum,
} from "@/app/lib/validation/buyer.schema";

function setParam(sp: URLSearchParams, key: string, value?: string | null) {
  if (value && value.length) sp.set(key, value);
  else sp.delete(key);
}

export default function SearchFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [propertyType, setPropertyType] = useState(
    searchParams.get("propertyType") || ""
  );
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [timeline, setTimeline] = useState(
    searchParams.get("timeline") || ""
  );

  // Debounce search
  useEffect(() => {
    const handle = setTimeout(() => {
      const sp = new URLSearchParams(searchParams.toString());
      setParam(sp, "q", query);
      sp.set("page", "1");
      replace(`${pathname}?${sp.toString()}`);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Instant filters
  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString());
    setParam(sp, "city", city || null);
    setParam(sp, "propertyType", propertyType || null);
    setParam(sp, "status", status || null);
    setParam(sp, "timeline", timeline || null);
    sp.set("page", "1");
    replace(`${pathname}?${sp.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, propertyType, status, timeline]);

  const cityOptions = CityEnum.options;
  const propertyOptions = PropertyTypeEnum.options;
  const statusOptions = StatusEnum.options;
  const timelineOptions = TimelineEnum.options;
  const timelineLabels: Record<(typeof timelineOptions)[number], string> = {
    LT3M: "0-3m",
    M3_TO_6: "3-6m",
    GT6M: ">6m",
    Exploring: "Exploring",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      <div className="md:col-span-2">
        <label htmlFor="q" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
          Search
        </label>
        <input
          id="q"
          className="input"
          placeholder="Search name, phone, email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">City</label>
        <select className="select" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Property</label>
        <select
          className="select"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          <option value="">All</option>
          {propertyOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Status</label>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          {statusOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Timeline</label>
        <select
          className="select"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
        >
          <option value="">All</option>
          {timelineOptions.map((c) => (
            <option key={c} value={c}>
              {timelineLabels[c]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
