"use client";

import { ConnectionError } from "@/components/common/connection-error";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="page-shell centered-state">
      <ConnectionError onRetry={reset} />
    </main>
  );
}
