"use client";

import { useMemo, useState } from "react";
import type { RelationshipWithDetails } from "@/lib/types";
import { ReachOut } from "./ReachOut";
import { PersonCard } from "./PersonCard";
import { Modal } from "./Modal";
import { PersonForm } from "./PersonForm";
import { WeeklyCheckinBanner } from "./WeeklyCheckinBanner";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function Dashboard({
  people,
  userName,
}: {
  people: RelationshipWithDetails[];
  userName: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState<
    { mode: "add" } | { mode: "edit"; person: RelationshipWithDetails } | null
  >(null);

  const active = people.filter((p) => !p.archived);
  const archived = people.filter((p) => p.archived);

  const firstName = useMemo(() => userName.split(/[\s@]/)[0], [userName]);

  function select(id: string) {
    setActiveId((cur) => (cur === id ? null : id));
    setShowArchived(false);
    requestAnimationFrame(() => {
      document
        .getElementById(`person-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <div className="min-h-dvh">
      <WeeklyCheckinBanner />
      <div className="mx-auto w-full max-w-2xl px-5 sm:px-6 pb-24 pt-10 sm:pt-16">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted mb-3">
              Companion
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
              {greeting()},{" "}
              <span className="italic">{firstName}</span>.
            </h1>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-[13px] text-muted hover:text-ink transition whitespace-nowrap mt-1"
            >
              Sign out
            </button>
          </form>
        </header>

        {/* Reach Out */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-2xl text-ink">Reach out</h2>
            <span className="text-[13px] text-muted">
              this week &amp; soon
            </span>
          </div>
          <ReachOut people={active} onSelect={select} />
        </section>

        {/* Everyone */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-serif text-2xl text-ink">People</h2>
            <button
              onClick={() => setDialog({ mode: "add" })}
              className="text-[13px] font-medium text-sage-deep hover:text-sage transition"
            >
              + Add person
            </button>
          </div>

          {active.length === 0 ? (
            <div className="rounded-xl2 border border-dashed border-line bg-paper/60 px-6 py-12 text-center">
              <p className="font-serif text-xl text-ink">
                No one here yet.
              </p>
              <p className="mt-2 text-[15px] text-ink-soft">
                Add the people you want to stay close to.
              </p>
              <button
                onClick={() => setDialog({ mode: "add" })}
                className="mt-5 rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-cream hover:bg-ink/90 transition"
              >
                Add your first person
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {active.map((person) => (
                <div key={person.id} id={`person-${person.id}`}>
                  <PersonCard
                    person={person}
                    expanded={activeId === person.id}
                    onToggle={() =>
                      setActiveId((cur) =>
                        cur === person.id ? null : person.id,
                      )
                    }
                    onEdit={() => setDialog({ mode: "edit", person })}
                  />
                </div>
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowArchived((s) => !s)}
                className="text-[13px] text-muted hover:text-ink transition"
              >
                {showArchived ? "Hide" : "Show"} archived ({archived.length})
              </button>
              {showArchived && (
                <div className="space-y-2.5 mt-4 opacity-80">
                  {archived.map((person) => (
                    <div key={person.id} id={`person-${person.id}`}>
                      <PersonCard
                        person={person}
                        expanded={activeId === person.id}
                        onToggle={() =>
                          setActiveId((cur) =>
                            cur === person.id ? null : person.id,
                          )
                        }
                        onEdit={() => setDialog({ mode: "edit", person })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? "Edit person" : "Add someone"}
      >
        {dialog && (
          <PersonForm
            person={dialog.mode === "edit" ? dialog.person : undefined}
            onDone={() => setDialog(null)}
          />
        )}
      </Modal>
    </div>
  );
}
