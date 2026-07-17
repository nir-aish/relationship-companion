"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md bg-paper border border-line rounded-t-xl2 sm:rounded-xl2 shadow-[0_-8px_40px_-24px_rgba(0,0,0,0.4),0_24px_60px_-30px_rgba(0,0,0,0.5)] animate-fade-in max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-line sticky top-0 bg-paper/95 backdrop-blur-sm rounded-t-xl2">
          <h3 className="font-serif text-xl text-ink">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-ink transition-colors -mr-1 p-1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
