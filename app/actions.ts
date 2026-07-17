"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Cadence, InteractionType } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

function clean(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = value.toString().trim();
  return s.length ? s : null;
}

export async function addRelationship(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = clean(formData.get("name"));
  if (!name) return;

  const { error } = await supabase.from("relationships").insert({
    user_id: user.id,
    name,
    photo: clean(formData.get("photo")),
    birthday: clean(formData.get("birthday")),
    cadence: (clean(formData.get("cadence")) as Cadence) ?? "2weeks",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function updateRelationship(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = clean(formData.get("id"));
  if (!id) return;

  const { error } = await supabase
    .from("relationships")
    .update({
      name: clean(formData.get("name")),
      photo: clean(formData.get("photo")),
      birthday: clean(formData.get("birthday")),
      cadence: (clean(formData.get("cadence")) as Cadence) ?? "2weeks",
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function setArchived(id: string, archived: boolean) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("relationships")
    .update({ archived })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteRelationship(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("relationships")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function logInteraction(
  relationshipId: string,
  type: InteractionType = "message",
  date?: string,
  note?: string,
) {
  const { supabase, user } = await requireUser();
  const day = date?.trim() || new Date().toISOString().slice(0, 10);

  const { error: insertError } = await supabase.from("interactions").insert({
    user_id: user.id,
    relationship_id: relationshipId,
    date: day,
    type,
  });
  if (insertError) throw new Error(insertError.message);

  // Only advance last_interaction_date; never move it backwards.
  const { data: rel } = await supabase
    .from("relationships")
    .select("last_interaction_date")
    .eq("id", relationshipId)
    .eq("user_id", user.id)
    .single();

  const current = rel?.last_interaction_date ?? null;
  const newLast = !current || current < day ? day : current;

  const { error: updateError } = await supabase
    .from("relationships")
    .update({ last_interaction_date: newLast })
    .eq("id", relationshipId)
    .eq("user_id", user.id);
  if (updateError) throw new Error(updateError.message);

  const trimmedNote = note?.trim();
  if (trimmedNote) {
    const { error: noteError } = await supabase.from("context_entries").insert({
      user_id: user.id,
      relationship_id: relationshipId,
      text: trimmedNote,
    });
    if (noteError) throw new Error(noteError.message);
  }

  revalidatePath("/");
}

export async function addEvent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const relationshipId = clean(formData.get("relationship_id"));
  const title = clean(formData.get("title"));
  const date = clean(formData.get("date"));
  if (!relationshipId || !title || !date) return;

  const { error } = await supabase.from("events").insert({
    user_id: user.id,
    relationship_id: relationshipId,
    title,
    date,
    notes: clean(formData.get("notes")),
    is_birthday: formData.get("is_birthday") === "on",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteEvent(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function addContext(formData: FormData) {
  const { supabase, user } = await requireUser();
  const relationshipId = clean(formData.get("relationship_id"));
  const text = clean(formData.get("text"));
  if (!relationshipId || !text) return;

  const { error } = await supabase.from("context_entries").insert({
    user_id: user.id,
    relationship_id: relationshipId,
    text,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function deleteContext(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("context_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}
