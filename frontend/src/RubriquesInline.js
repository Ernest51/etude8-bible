import React from "react";

/**
 * RubriquesInline
 * Affiche la liste des 29 rubriques SOUS le header "Rubriques (29)"
 * et remplace la sidebar. Utilise Tailwind pour le style.
 *
 * Props:
 * - items: Array<{ id: number, title: string, subtitle?: string }>
 * - activeId?: number
 * - onSelect?: (id: number) => void
 *
 * Exemple d'utilisation:
 *   <RubriquesInline
 *     items={rubriques}
 *     activeId={activeRubriqueId}
 *     onSelect={(id) => setActiveRubriqueId(id)}
 *   />
 */
export default function RubriquesInline({ items = [], activeId, onSelect }) {
  return (
    <section className="w-full">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Rubriques ({items.length || 29})
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cliquez sur une rubrique dans la liste pour afficher son contenu détaillé ci-dessous
        </p>
      </div>

      {/* Liste */}
      <div className="mt-4 px-4 sm:px-6 lg:px-8">
        <ul className="flex flex-col gap-2">
          {items.map((it, idx) => {
            const isActive = it.id === activeId;
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(it.id)}
                  className={[
                    "w-full text-left rounded-xl border transition",
                    "px-4 py-3",
                    isActive
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:bg-muted"
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-sm">
                      {idx}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{it.title}</div>
                      {it.subtitle ? (
                        <div className="text-xs text-muted-foreground truncate">
                          {it.subtitle}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}