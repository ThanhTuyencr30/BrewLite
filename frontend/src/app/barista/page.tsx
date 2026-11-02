"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/ui";
import { BaristaScreen } from "@/components/barista";

export default function BaristaPage() {
  const router = useRouter();

  return (
    <AppShell>
      <BaristaScreen onBack={() => router.push("/")} />
    </AppShell>
  );
}
