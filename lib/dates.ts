import {
  addWeeks,
  differenceInCalendarDays,
  isBefore,
  parseISO,
  setYear,
  startOfDay,
} from "date-fns";
import type { Cadence, Relationship, RelationshipEvent } from "./types";

export const UPCOMING_WINDOW_DAYS = 8;

export function cadenceWeeks(cadence: Cadence): number {
  switch (cadence) {
    case "1week":
      return 1;
    case "2weeks":
      return 2;
    case "3weeks":
      return 3;
  }
}

export function cadenceLabel(cadence: Cadence): string {
  switch (cadence) {
    case "1week":
      return "Every week";
    case "2weeks":
      return "Every 2 weeks";
    case "3weeks":
      return "Every 3 weeks";
  }
}

function parse(date: string): Date {
  return startOfDay(parseISO(date));
}

/** Human-friendly, deliberately vague: "this week", "2 weeks ago". */
export function approxWeeksAgo(date: string | null): string {
  if (!date) return "no interactions yet";
  const days = differenceInCalendarDays(startOfDay(new Date()), parse(date));
  if (days < 0) return "just now";
  const weeks = Math.round(days / 7);
  if (weeks <= 0) return "this week";
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

/** When is this relationship next "due" based on cadence + last interaction? */
export function dueDate(rel: Relationship): Date | null {
  if (!rel.last_interaction_date) return null;
  return addWeeks(parse(rel.last_interaction_date), cadenceWeeks(rel.cadence));
}

export function isOverdue(rel: Relationship): boolean {
  if (rel.archived) return false;
  const due = dueDate(rel);
  if (!due) return true; // never logged an interaction → time to reach out
  return !isBefore(startOfDay(new Date()), due);
}

/** Next annual occurrence of a month/day, from today (inclusive). */
function nextAnnualOccurrence(date: Date): Date {
  const today = startOfDay(new Date());
  let candidate = startOfDay(setYear(date, today.getFullYear()));
  if (isBefore(candidate, today)) {
    candidate = startOfDay(setYear(date, today.getFullYear() + 1));
  }
  return candidate;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  daysUntil: number;
  isBirthday: boolean;
}

/**
 * Events (and the birthday field) happening within `withinDays`.
 * Birthdays recur annually; other events use their literal date.
 */
export function upcomingEventsFor(
  rel: Relationship,
  events: RelationshipEvent[],
  withinDays: number = UPCOMING_WINDOW_DAYS,
): UpcomingEvent[] {
  const today = startOfDay(new Date());
  const result: UpcomingEvent[] = [];

  if (rel.birthday) {
    const next = nextAnnualOccurrence(parse(rel.birthday));
    const days = differenceInCalendarDays(next, today);
    if (days >= 0 && days <= withinDays) {
      result.push({
        id: `bday-${rel.id}`,
        title: "Birthday",
        daysUntil: days,
        isBirthday: true,
      });
    }
  }

  for (const ev of events) {
    const base = parse(ev.date);
    const when = ev.is_birthday ? nextAnnualOccurrence(base) : base;
    const days = differenceInCalendarDays(when, today);
    if (days >= 0 && days <= withinDays) {
      result.push({
        id: ev.id,
        title: ev.title,
        daysUntil: days,
        isBirthday: ev.is_birthday,
      });
    }
  }

  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function relativeDayLabel(daysUntil: number): string {
  if (daysUntil <= 0) return "today";
  if (daysUntil === 1) return "tomorrow";
  return `in ${daysUntil} days`;
}
