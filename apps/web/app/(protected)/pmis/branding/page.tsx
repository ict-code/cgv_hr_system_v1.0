"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useBranding, type Branding } from "@/hooks/use-branding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_LOGO_BYTES = 1_000_000;

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function BrandingPage() {
  const queryClient = useQueryClient();
  const { title, subtitle, logoSrc, isLoading } = useBranding();
  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [subtitleDraft, setSubtitleDraft] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const titleValue = titleDraft ?? title;
  const subtitleValue = subtitleDraft ?? subtitle;
  const dirty = titleValue !== title || subtitleValue !== subtitle;

  const save = useMutation({
    mutationFn: () =>
      apiFetch<Branding>("/branding", {
        method: "PUT",
        body: JSON.stringify({ title: titleValue.trim(), subtitle: subtitleValue.trim() }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["branding"], data);
      setTitleDraft(null);
      setSubtitleDraft(null);
    },
  });

  const upload = useMutation({
    mutationFn: async (f: File) =>
      apiFetch<Branding>("/branding/logo", {
        method: "PUT",
        body: JSON.stringify({ mime: f.type, data: await readAsBase64(f) }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["branding"], data);
      setFile(null);
    },
  });

  function pickFile(f: File | null) {
    setFileError(null);
    setFile(null);
    if (!f) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) return setFileError("Use a PNG, JPEG or WebP image.");
    if (f.size > MAX_LOGO_BYTES) return setFileError("Logo must be 1 MB or smaller.");
    setFile(f);
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="Current logo" className="h-16 w-16 shrink-0 rounded-md border border-dashed border-[var(--color-border)] object-contain p-1" />
          <div className="flex flex-1 flex-col gap-2">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} className="text-sm" />
            {fileError && <p className="text-sm text-[var(--color-danger)]">{fileError}</p>}
            {upload.isError && <p className="text-sm text-[var(--color-danger)]">{(upload.error as Error).message}</p>}
            <Button onClick={() => file && upload.mutate(file)} disabled={!file || upload.isPending}>
              {upload.isPending ? "Uploading…" : "Upload logo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brandTitle">System name</Label>
            <Input id="brandTitle" value={titleValue} maxLength={120} disabled={isLoading} onChange={(e) => setTitleDraft(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="brandSubtitle">Subtitle</Label>
            <Input id="brandSubtitle" value={subtitleValue} maxLength={200} disabled={isLoading} onChange={(e) => setSubtitleDraft(e.target.value)} />
          </div>
          {save.isError && <p className="text-sm text-[var(--color-danger)]">{(save.error as Error).message}</p>}
          <Button onClick={() => save.mutate()} disabled={!dirty || !titleValue.trim() || save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
