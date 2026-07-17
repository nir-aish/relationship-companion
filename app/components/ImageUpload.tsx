"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ImageUpload({
  initialUrl,
  name,
}: {
  initialUrl?: string | null;
  name: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("That image is a bit large — please pick one under 8 MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Please sign in again.");
      setUploading(false);
      return;
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setUrl(data.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <span className="h-16 w-16 shrink-0 rounded-full overflow-hidden bg-cream-deep ring-1 ring-line flex items-center justify-center">
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-muted">
              <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M5 19c1.6-3 4-4.5 7-4.5s5.4 1.5 7 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-line bg-white px-4 py-2 text-[14px] font-medium text-ink hover:border-ink/20 disabled:opacity-60 transition self-start"
          >
            {uploading ? "Uploading…" : url ? "Change photo" : "Add photo"}
          </button>
          {url && !uploading && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="text-[13px] text-muted hover:text-clay transition self-start"
            >
              Remove
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {error && <p className="mt-2 text-[13px] text-clay">{error}</p>}
    </div>
  );
}
