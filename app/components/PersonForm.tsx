"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addRelationship, updateRelationship } from "../actions";
import type { Cadence, RelationshipWithDetails } from "@/lib/types";
import { ImageUpload } from "./ImageUpload";

const fieldClass =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition";
const labelClass =
  "block text-xs uppercase tracking-[0.16em] text-muted mb-1.5";

const cadenceOptions: { value: Cadence; label: string }[] = [
  { value: "1week", label: "Weekly" },
  { value: "2weeks", label: "Every 2 weeks" },
  { value: "3weeks", label: "Every 3 weeks" },
];

export function PersonForm({
  person,
  onDone,
}: {
  person?: RelationshipWithDetails;
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cadence, setCadence] = useState<Cadence>(person?.cadence ?? "2weeks");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("cadence", cadence);
    startTransition(async () => {
      if (person) {
        formData.set("id", person.id);
        await updateRelationship(formData);
      } else {
        await addRelationship(formData);
      }
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          autoFocus={!person}
          defaultValue={person?.name}
          placeholder="Who is this?"
          className={fieldClass}
        />
      </div>

      <div>
        <span className={labelClass}>
          Photo <span className="normal-case tracking-normal">(optional)</span>
        </span>
        <ImageUpload name="photo" initialUrl={person?.photo} />
      </div>

      <div>
        <label className={labelClass} htmlFor="birthday">
          Birthday <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <input
          id="birthday"
          name="birthday"
          type="date"
          defaultValue={person?.birthday ?? ""}
          className={fieldClass}
        />
      </div>

      <div>
        <span className={labelClass}>How often to stay in touch</span>
        <div className="grid grid-cols-3 gap-2">
          {cadenceOptions.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setCadence(opt.value)}
              className={`rounded-xl border px-2 py-2.5 text-[13px] font-medium transition ${
                cadence === opt.value
                  ? "border-sage bg-sage/10 text-sage-deep"
                  : "border-line bg-white text-ink-soft hover:border-ink/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-full border border-line bg-white py-2.5 text-[15px] text-ink-soft hover:border-ink/20 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-full bg-ink py-2.5 text-[15px] font-medium text-cream hover:bg-ink/90 disabled:opacity-60 transition"
        >
          {pending ? "Saving…" : person ? "Save changes" : "Add person"}
        </button>
      </div>
    </form>
  );
}
