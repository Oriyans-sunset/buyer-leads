"use client";

export default function BuyersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[50vh] grid place-items-center p-6">
      <div className="card p-6 max-w-lg w-full text-center">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-600 mb-4 break-words">{error?.message || "An unexpected error occurred."}</p>
        <div className="flex items-center justify-center gap-2">
          <button className="btn btn-primary" onClick={() => reset()}>Try again</button>
          <a className="btn btn-ghost" href="/buyers">Back to list</a>
        </div>
      </div>
    </div>
  );
}

