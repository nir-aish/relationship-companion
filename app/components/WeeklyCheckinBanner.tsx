"use client";

import { useEffect, useState } from "react";
import { CHECKIN_LABEL, complete, getCurrent } from "@/lib/checkins";

export function WeeklyCheckinBanner() {
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrent()
      .then((state) => {
        if (!active) return;
        setVisible(state.inWindow && !state.completed);
      })
      .catch(() => {
        /* fail quietly — the banner is non-critical */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCheck() {
    // Record completion and immediately hide the banner.
    setSaving(true);
    setVisible(false);
    try {
      await complete();
    } catch {
      /* if it was already completed elsewhere, staying hidden is correct */
    } finally {
      setSaving(false);
    }
  }

  if (loading || !visible) return null;

  return (
    <div className="w-full border-b border-line bg-cream-deep/70">
      <label className="mx-auto flex max-w-2xl cursor-pointer select-none items-center gap-2.5 px-5 py-2.5 text-start sm:px-6">
        <input
          type="checkbox"
          checked={false}
          disabled={saving}
          onChange={handleCheck}
          aria-label={CHECKIN_LABEL}
          className="h-4 w-4 rounded border-muted/50 accent-sage"
        />
        <span className="text-[13px] font-medium text-ink-soft">
          {CHECKIN_LABEL}
        </span>
      </label>
    </div>
  );
}
