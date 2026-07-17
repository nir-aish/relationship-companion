import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  ContextEntry,
  Relationship,
  RelationshipEvent,
  RelationshipWithDetails,
} from "@/lib/types";
import { Dashboard } from "./components/Dashboard";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: relationships }, { data: events }, { data: context }] =
    await Promise.all([
      supabase
        .from("relationships")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase.from("events").select("*"),
      supabase
        .from("context_entries")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const eventsByRel = new Map<string, RelationshipEvent[]>();
  for (const ev of (events ?? []) as RelationshipEvent[]) {
    const list = eventsByRel.get(ev.relationship_id) ?? [];
    list.push(ev);
    eventsByRel.set(ev.relationship_id, list);
  }

  const contextByRel = new Map<string, ContextEntry[]>();
  for (const c of (context ?? []) as ContextEntry[]) {
    const list = contextByRel.get(c.relationship_id) ?? [];
    list.push(c);
    contextByRel.set(c.relationship_id, list);
  }

  const people: RelationshipWithDetails[] = (
    (relationships ?? []) as Relationship[]
  ).map((rel) => ({
    ...rel,
    events: eventsByRel.get(rel.id) ?? [],
    context: contextByRel.get(rel.id) ?? [],
  }));

  return (
    <Dashboard
      people={people}
      userName={
        (user.user_metadata?.full_name as string | undefined) ??
        user.email ??
        "friend"
      }
    />
  );
}
