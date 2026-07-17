"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import type { RelationshipWithDetails } from "@/lib/types";
import {
  approxWeeksAgo,
  cadenceLabel,
  isOverdue,
  upcomingEventsFor,
} from "@/lib/dates";
import {
  addContext,
  addEvent,
  deleteContext,
  deleteEvent,
  deleteRelationship,
  setArchived,
} from "../actions";
import { Avatar } from "./Avatar";

export function PersonCard({
  person,
  expanded,
  onToggle,
  onEdit,
}: {
  person: RelationshipWithDetails;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const overdue = isOverdue(person);
  const softDate = (d: string) => format(parseISO(d), "MMM d");

  return (
    <div
      className={`rounded-xl2 border bg-paper transition-shadow ${
        expanded
          ? "border-line shadow-[0_12px_40px_-28px_rgba(0,0,0,0.4)]"
          : "border-line hover:shadow-[0_8px_30px_-26px_rgba(0,0,0,0.4)]"
      }`}
    >
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
        <Avatar name={person.name} photo={person.photo} size="sm" />
        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <span className="flex items-center gap-2">
            <span className="font-medium text-ink truncate">{person.name}</span>
            {overdue && !expanded && (
              <span className="h-1.5 w-1.5 rounded-full bg-clay shrink-0" />
            )}
          </span>
          <span className="block text-[13px] text-muted truncate">
            {cadenceLabel(person.cadence)} ·{" "}
            {approxWeeksAgo(person.last_interaction_date)}
          </span>
        </button>
        <button
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="text-muted hover:text-ink transition-colors p-1"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path
              d="M4.5 7l4.5 4 4.5-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-4 sm:px-5 pb-5 pt-1 animate-fade-in border-t border-line/70 mt-1">
          <UpcomingEvents person={person} softDate={softDate} />
          <ContextNotes person={person} />
          <Controls person={person} onEdit={onEdit} />
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs uppercase tracking-[0.18em] text-muted mb-2.5 mt-5">
      {children}
    </h4>
  );
}

function UpcomingEvents({
  person,
  softDate,
}: {
  person: RelationshipWithDetails;
  softDate: (d: string) => string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const upcomingBadges = upcomingEventsFor(person, person.events, 8);
  const upcomingIds = new Set(upcomingBadges.map((u) => u.id));
  const events = [...person.events].sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );

  return (
    <div>
      <SectionTitle>Events</SectionTitle>
      {person.birthday && (
        <p className="text-[14px] text-ink-soft mb-1.5">
          🎂 Birthday · {softDate(person.birthday)}
        </p>
      )}
      {events.length === 0 && !person.birthday && (
        <p className="text-[14px] text-muted">No events yet.</p>
      )}
      <ul className="space-y-1.5">
        {events.map((ev) => (
          <li
            key={ev.id}
            className="group flex items-center gap-2 text-[14px] text-ink-soft"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                upcomingIds.has(ev.id) ? "bg-clay" : "bg-muted/40"
              }`}
            />
            <span className="flex-1">
              {ev.is_birthday ? "🎂 " : ""}
              {ev.title}
              <span className="text-muted"> · {softDate(ev.date)}</span>
              {ev.notes && (
                <span className="block text-[13px] text-muted">{ev.notes}</span>
              )}
            </span>
            <button
              onClick={() =>
                startTransition(async () => {
                  await deleteEvent(ev.id);
                  router.refresh();
                })
              }
              aria-label="Delete event"
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-clay transition p-1"
            >
              <TinyX />
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <form
          action={(fd) =>
            startTransition(async () => {
              await addEvent(fd);
              router.refresh();
              setOpen(false);
            })
          }
          className="mt-3 space-y-2 rounded-xl border border-line bg-cream/40 p-3"
        >
          <input type="hidden" name="relationship_id" value={person.id} />
          <input
            name="title"
            required
            placeholder="Event name"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-sage"
          />
          <div className="flex gap-2">
            <input
              name="date"
              type="date"
              required
              className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-sage"
            />
            <label className="flex items-center gap-1.5 text-[13px] text-ink-soft px-2">
              <input type="checkbox" name="is_birthday" className="accent-sage" />
              Recurs yearly
            </label>
          </div>
          <textarea
            name="notes"
            rows={2}
            placeholder="Notes (optional)"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-sage resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[13px] text-muted hover:text-ink px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-ink text-cream text-[13px] px-4 py-1.5 hover:bg-ink/90"
            >
              Add event
            </button>
          </div>
        </form>
      ) : (
        <AddLink onClick={() => setOpen(true)}>+ Add event</AddLink>
      )}
    </div>
  );
}

function ContextNotes({ person }: { person: RelationshipWithDetails }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <SectionTitle>Context</SectionTitle>
      {person.context.length === 0 && (
        <p className="text-[14px] text-muted">
          Little notes to remember — what matters to them, what you talked about.
        </p>
      )}
      <ul className="space-y-1.5">
        {person.context.map((c) => (
          <li
            key={c.id}
            className="group flex items-start gap-2 text-[14px] text-ink-soft"
          >
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-muted/40 shrink-0" />
            <span className="flex-1">{c.text}</span>
            <button
              onClick={() =>
                startTransition(async () => {
                  await deleteContext(c.id);
                  router.refresh();
                })
              }
              aria-label="Delete note"
              className="opacity-0 group-hover:opacity-100 text-muted hover:text-clay transition p-1"
            >
              <TinyX />
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <form
          action={(fd) =>
            startTransition(async () => {
              await addContext(fd);
              router.refresh();
              setOpen(false);
            })
          }
          className="mt-3 space-y-2"
        >
          <input type="hidden" name="relationship_id" value={person.id} />
          <textarea
            name="text"
            required
            autoFocus
            rows={2}
            placeholder="Add a note…"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-[14px] outline-none focus:border-sage resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[13px] text-muted hover:text-ink px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-ink text-cream text-[13px] px-4 py-1.5 hover:bg-ink/90"
            >
              Save note
            </button>
          </div>
        </form>
      ) : (
        <AddLink onClick={() => setOpen(true)}>+ Add note</AddLink>
      )}
    </div>
  );
}

function Controls({
  person,
  onEdit,
}: {
  person: RelationshipWithDetails;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 pt-4 border-t border-line/70 text-[13px]">
      <button
        onClick={onEdit}
        className="text-ink-soft hover:text-ink transition"
      >
        Edit
      </button>
      <button
        onClick={() =>
          startTransition(async () => {
            await setArchived(person.id, !person.archived);
            router.refresh();
          })
        }
        className="text-ink-soft hover:text-ink transition"
      >
        {person.archived ? "Unarchive" : "Archive"}
      </button>
      <button
        onClick={() => {
          if (
            confirm(
              `Remove ${person.name}? This deletes their notes and events too.`,
            )
          ) {
            startTransition(async () => {
              await deleteRelationship(person.id);
              router.refresh();
            });
          }
        }}
        className="text-muted hover:text-clay transition ml-auto"
      >
        Delete
      </button>
    </div>
  );
}

function AddLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-2.5 text-[13px] font-medium text-sage-deep hover:text-sage transition"
    >
      {children}
    </button>
  );
}

function TinyX() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M3.5 3.5l7 7M10.5 3.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
