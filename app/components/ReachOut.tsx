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

export function ReachOut({
  people,
  onSelect,
}: {
  people: RelationshipWithDetails[];
  onSelect: (id: string) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Record<string, InteractionType>>({});

  const rows: ReachOutRow[] = people
    .map((person) => ({
      person,
      overdue: isOverdue(person),
      upcoming: upcomingEventsFor(person, person.events),
    }))
    .filter((r) => r.overdue || r.upcoming.length > 0);

  function handleCheck(person: RelationshipWithDetails) {
    setDone((prev) => new Set(prev).add(person.id));
    const type = types[person.id] ?? "message";
    startTransition(async () => {
      await logInteraction(person.id, type);
      router.refresh();
    });
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
              onClick={() => !isDone && handleCheck(person)}
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
                onChange={(e) =>
                  setTypes((prev) => ({
                    ...prev,
                    [person.id]: e.target.value as InteractionType,
                  }))
                }
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
  );
}
