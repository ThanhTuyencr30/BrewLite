"use client";

import { ConnectionError } from "@/components/common/connection-error";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ConnectionError onRetry={reset} />;
}
