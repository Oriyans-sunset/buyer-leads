"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type ImportResult = {
  inserted: number;
  errors: { row: number; message: string }[];
};

export default function ImportExportBar() {
  const sp = useSearchParams();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportHref = `/api/buyers/export?${sp.toString()}`;

  async function onImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("Please choose a CSV file");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/buyers/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || data?.error || "Import failed");
        return;
      }
      setResult(data as ImportResult);
      // reset file input
      fileInput.value = "";
    } catch (e: any) {
      setError(e?.message || "Import failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <a href={exportHref} className="btn btn-ghost">
            Export CSV
          </a>
          <form onSubmit={onImport} className="flex items-center gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="btn btn-primary"
            >
              {uploading ? "Importing..." : "Import CSV"}
            </button>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              aria-label="Choose CSV file"
              className="text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-gray-100 file:text-sm file:font-medium hover:file:bg-gray-200 dark:file:bg-gray-800 dark:file:text-gray-200"
            />
          </form>
        </div>
      </div>

      {(error || result) && (
        <div className="card p-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {result && (
            <div className="text-sm">
              <p className="text-green-700">Inserted {result.inserted} rows</p>
              {result.errors?.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">
                    Errors ({result.errors.length}):
                  </p>
                  <div className="max-h-40 overflow-auto border rounded mt-1">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800/60">
                        <tr>
                          <th className="text-left p-1">Row</th>
                          <th className="text-left p-1">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((e, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-1 align-top">{e.row}</td>
                            <td className="p-1">{e.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
