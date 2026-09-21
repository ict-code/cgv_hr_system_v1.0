"use client";

import { Construction } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";

function ComingSoonContent() {
  const params = useSearchParams();
  const title = params.get("title") ?? "This screen";
  const section = params.get("section");

  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Construction className="h-8 w-8 text-[var(--color-muted)]" />
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
          {section && <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">{section}</p>}
          <p className="text-sm text-[var(--color-muted)]">
            This screen exists in the legacy eGAPS/PMIS system and is mapped in the new navigation, but hasn't been
            built yet in EGAPS Modern.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={null}>
      <ComingSoonContent />
    </Suspense>
  );
}
