import React from "react";

/**
 * RubriquesInline
 * Colonne gauche scrollable + sticky (desktop) pour lister les rubriques.
 *
 * Props:
 * - items: Array<{ id:number, title:string, subtitle?:string }>
 * - activeId?: number
 * - onSelect?: (id:number) => void
 * - sticky?: boolean (true par défaut)
 * - topClass?: string (offset sticky Tailwind, ex: 'lg:top-36 xl:top-40')
 */
export default function RubriquesInline({
  items = [],
  activeId = 0,
  onSelect,
  sticky = true,
  topClass = "lg:top-36 xl:top-40",
}) {
  return (
    <aside className={`w-full ${sticky ? `lg:sticky ${topClass}` : ""}`}>
      <div className="rounded-2xl border bg-white/60 p-2">
        <div
          className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 overscroll-contain"
          style={{ scrollbarGutter: "stable both-edges" }}
          aria-label="Liste des rubriques"
        >
          <ul className="flex flex-col gap-2">
            {items.map((it, idx) => {
              const id = it.id ?? idx;
              const isActive = id === activeId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onSelect?.(id)}
                    className={[
                      "w-full text-left rounded-xl border px-3 py-2 transition",
                      isActive
                        ? "border-emerald-400 bg-emerald-50"
                        : "hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs">
                        {idx}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{it.title}</div>
                        {it.subtitle ? (
                          <div className="text-xs text-gray-500 truncate">
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
      </div>
    </aside>
  );
}
