export type Cadence = "1week" | "2weeks" | "3weeks";

export type InteractionType = "message" | "call" | "met" | "video" | "other";

export interface Relationship {
  id: string;
  user_id: string;
  name: string;
  photo: string | null;
  birthday: string | null; // ISO date (YYYY-MM-DD)
  cadence: Cadence;
  last_interaction_date: string | null;
  archived: boolean;
  created_at: string;
}

export interface RelationshipEvent {
  id: string;
  user_id: string;
  relationship_id: string;
  title: string;
  date: string;
  notes: string | null;
  is_birthday: boolean;
  created_at: string;
}

export interface ContextEntry {
  id: string;
  user_id: string;
  relationship_id: string;
  text: string;
  created_at: string;
}

export interface Interaction {
  id: string;
  user_id: string;
  relationship_id: string;
  date: string;
  type: InteractionType;
  created_at: string;
}

/** A relationship with its related records attached, ready for the UI. */
export interface RelationshipWithDetails extends Relationship {
  events: RelationshipEvent[];
  context: ContextEntry[];
}
