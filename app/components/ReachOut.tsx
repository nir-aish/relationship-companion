"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InteractionType, RelationshipWithDetails } from "@/lib/types";
import {
  approxWeeksAgo,
  cadenceLabel,
  isOverdue,
  relativeDayLabel,
  upcomingEventsFor,
} from "@/lib/dates";
import { logInteraction } from "../actions";
import { Avatar } from "./Avatar";
import { Modal } from "./Modal";

interface ReachOutRow {
  person: RelationshipWithDetails;
  overdue: boolean;
  upcoming: ReturnType<typeof upcomingEventsFor>;
}

const typeOptions: InteractionType[] = [
  "message",
  "call",
  "met",
  "video",
  "other",
];

function todayStr(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function ReachOut({
  people,
  onSelect,
}: {
  people: RelationshipWithDetails[];
  onSelect: (id: string) => void;
}) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Record<string, InteractionType>>({});
  const [logging, setLogging] = useState<{
    person: RelationshipWithDetails;
    type: InteractionType;
  } | null>(null);

  const rows: ReachOutRow[] = people
    .map((person) => ({
      person,
      overdue: isOverdue(person),
      upcoming: upcomingEventsFor(person, person.events),
    }))
    .filter((r) => r.overdue || r.upcoming.length > 0);

  function openLog(person: RelationshipWithDetails, type: InteractionType) {
    setLogging({ person, type });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl2 border border-line bg-paper px-6 py-10 text-center">
        <p className="font-serif text-xl text-ink">You&rsquo;re all caught up.</p>
        <p className="mt-2 text-[15px] text-ink-soft">
          No one to reach out to right now. Enjoy the calm.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-line rounded-xl2 border border-line bg-paper overflow-hidden">
        {rows.map(({ person, overdue, upcoming }) => {
          const isDone = done.has(person.id);
          const event = upcoming[0];
          return (
            <li
              key={person.id}
              className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 transition-colors ${
                isDone ? "opacity-50" : "hover:bg-cream/40"
              }`}
            >
              <button
                onClick={() =>
                  !isDone && openLog(person, types[person.id] ?? "message")
                }
                disabled={isDone}
                aria-label={`Log interaction with ${person.name}`}
                className={`shrink-0 h-6 w-6 rounded-full border flex items-center justify-center transition ${
                  isDone
                    ? "border-sage bg-sage text-white"
                    : "border-muted/50 hover:border-sage"
                }`}
              >
                {isDone && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2.5 7.5l3 3 6-6.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              <Avatar name={person.name} photo={person.photo} size="sm" />

              <button
                onClick={() => onSelect(person.id)}
                className="flex-1 text-left min-w-0"
              >
                <span
                  className={`block font-medium text-ink truncate ${
                    isDone ? "line-through" : ""
                  }`}
                >
                  {person.name}
                </span>
                <span className="block text-[13px] text-muted truncate">
                  {event ? (
                    <span className="text-clay">
                      {event.isBirthday ? "🎂 " : ""}
                      {event.title} · {relativeDayLabel(event.daysUntil)}
                    </span>
                  ) : (
                    <>
                      {cadenceLabel(person.cadence)} ·{" "}
                      {approxWeeksAgo(person.last_interaction_date)}
                    </>
                  )}
                  {overdue && !event && (
                    <span className="text-clay"> · time to reach out</span>
                  )}
                </span>
              </button>

              {!isDone && (
                <select
                  value={types[person.id] ?? "message"}
                  onChange={(e) => {
                    const type = e.target.value as InteractionType;
                    setTypes((prev) => ({ ...prev, [person.id]: type }));
                    openLog(person, type);
                  }}
                  aria-label="How did you connect?"
                  className="shrink-0 rounded-full border border-line bg-white/60 px-2.5 py-1 text-[12px] text-ink-soft capitalize outline-none focus:border-sage hover:border-ink/20 transition"
                >
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            </li>
          );
        })}
      </ul>

      <Modal
        open={logging !== null}
        onClose={() => setLogging(null)}
        title={logging ? `Time with ${logging.person.name}` : ""}
      >
        {logging && (
          <LogForm
            person={logging.person}
            initialType={logging.type}
            onClose={() => setLogging(null)}
            onLogged={(id) => {
              setDone((prev) => new Set(prev).add(id));
              setLogging(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

function LogForm({
  person,
  initialType,
  onClose,
  onLogged,
}: {
  person: RelationshipWithDetails;
  initialType: InteractionType;
  onClose: () => void;
  onLogged: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<InteractionType>(initialType);
  const [date, setDate] = useState<string>(todayStr());
  const [note, setNote] = useState<string>("");

  const fieldClass =
    "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition";
  const labelClass =
    "block text-xs uppercase tracking-[0.16em] text-muted mb-1.5";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await logInteraction(person.id, type, date, note);
      router.refresh();
      onLogged(person.id);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <span className={labelClass}>How did you connect?</span>
        <div className="grid grid-cols-5 gap-1.5">
          {typeOptions.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg border px-1 py-2 text-[12px] font-medium capitalize transition ${
                type === t
                  ? "border-sage bg-sage/10 text-sage-deep"
                  : "border-line bg-white text-ink-soft hover:border-ink/20"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="log-date">
          When
        </label>
        <input
          id="log-date"
          type="date"
          value={date}
          max={todayStr()}
          onChange={(e) => setDate(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="log-note">
          Anything to remember?{" "}
          <span className="normal-case tracking-normal">(optional)</span>
        </label>
        <textarea
          id="log-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you talk about? How are they doing?"
          className={`${fieldClass} resize-none`}
        />
        <p className="mt-1.5 text-[12px] text-muted">
          Saved to {person.name.split(" ")[0]}&rsquo;s notes.
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-line bg-white py-2.5 text-[15px] text-ink-soft hover:border-ink/20 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-full bg-ink py-2.5 text-[15px] font-medium text-cream hover:bg-ink/90 disabled:opacity-60 transition"
        >
          {pending ? "Saving…" : "Log it"}
        </button>
      </div>
    </form>
  );
}
