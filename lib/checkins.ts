import { createClient } from "@/lib/supabase/client";

/* -------------------------------------------------------------------------- */
/* Configurable constants — reuse this module in other apps by editing these.  */
/* -------------------------------------------------------------------------- */

/** IANA timezone the check-in window is anchored to. */
export const CHECKIN_TIMEZONE = "Asia/Jerusalem";
/** Day the window opens. 0 = Sunday, 1 = Monday … 5 = Friday, 6 = Saturday. */
export const CHECKIN_WEEKDAY = 5;
/** Hour (24h, in CHECKIN_TIMEZONE) the window opens. */
export const CHECKIN_HOUR = 8;
/** Banner label. */
export const CHECKIN_LABEL = "Weekly check-in";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface WeeklyCheckin {
  id: string;
  user_id: string;
  period_start: string;
  completed_at: string;
  created_at: string;
}

export interface CheckinState {
  inWindow: boolean;
  completed: boolean;
  record?: WeeklyCheckin | null;
  periodStart?: string;
}

/* -------------------------------------------------------------------------- */
/* Timezone math — all done via Intl.DateTimeFormat with the fixed timezone,   */
/* so results are identical regardless of the visitor's local timezone.        */
/* -------------------------------------------------------------------------- */

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

interface ZonedParts {
  weekday: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** The wall-clock parts of an instant, as seen in `timeZone`. */
function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const rawHour = get("hour");
  return {
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: rawHour === "24" ? 0 : Number(rawHour),
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

/** Convert a wall-clock time expressed in `timeZone` into a real UTC instant. */
function zonedWallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const p = zonedParts(new Date(utcGuess), timeZone);
  const zonedAsUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  const offset = zonedAsUtc - utcGuess;
  return new Date(utcGuess - offset);
}

/**
 * The start of the current period: the most recent CHECKIN_WEEKDAY at
 * CHECKIN_HOUR:00 in CHECKIN_TIMEZONE, at or before `now`. Before the hour on
 * the weekday itself, the active period is still the previous week's.
 */
export function currentPeriodStart(now: Date = new Date()): Date {
  const p = zonedParts(now, CHECKIN_TIMEZONE);

  let deltaDays = (p.weekday - CHECKIN_WEEKDAY + 7) % 7;
  if (deltaDays === 0 && p.hour < CHECKIN_HOUR) {
    deltaDays = 7;
  }

  // Step back deltaDays on the wall-clock calendar date.
  const base = new Date(Date.UTC(p.year, p.month - 1, p.day));
  base.setUTCDate(base.getUTCDate() - deltaDays);

  return zonedWallToUtc(
    base.getUTCFullYear(),
    base.getUTCMonth() + 1,
    base.getUTCDate(),
    CHECKIN_HOUR,
    0,
    0,
    CHECKIN_TIMEZONE,
  );
}

/** Is the check-in window currently open? */
export function isWindowOpen(now: Date = new Date()): boolean {
  return now.getTime() >= currentPeriodStart(now).getTime();
}

/* -------------------------------------------------------------------------- */
/* Client data functions                                                      */
/* -------------------------------------------------------------------------- */

/**
 * If the window isn't open, returns { inWindow: false, completed: false }.
 * Otherwise looks up the row for the current period and reports completion.
 */
export async function getCurrent(): Promise<CheckinState> {
  if (!isWindowOpen()) return { inWindow: false, completed: false };

  const periodStart = currentPeriodStart().toISOString();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("period_start", periodStart)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return {
    inWindow: true,
    completed: Boolean(data),
    record: (data as WeeklyCheckin | null) ?? null,
    periodStart,
  };
}

/** Insert a completion row for the current period for the signed-in user. */
export async function complete(): Promise<WeeklyCheckin> {
  const periodStart = currentPeriodStart().toISOString();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("weekly_checkins")
    .insert({ user_id: user.id, period_start: periodStart })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as WeeklyCheckin;
}

/** The user's check-in history, newest first. */
export async function list(): Promise<WeeklyCheckin[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weekly_checkins")
    .select("*")
    .order("period_start", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as WeeklyCheckin[]) ?? [];
}
