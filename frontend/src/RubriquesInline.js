import React from "react";

/**
 * RubriquesInline (version sans Tailwind)
 * - Colonne gauche sticky (desktop) + ascenseur interne
 *
 * Props:
 * - items: Array<{ id:number, title:string, subtitle?:string }>
 * - activeId?: number
 * - onSelect?: (id:number)=>void
 * - stickyTop?: number (px) offset sous le header, défaut 160
 */
export default function RubriquesInline({
  items = [],
  activeId = 0,
  onSelect,
  stickyTop = 160,
}) {
  return (
    <aside
      className="rubriques-aside"
      style={{ position: "sticky", top: stickyTop }}
      aria-label="Liste des rubriques"
    >
      <div className="rubriques-aside-card">
        <div className="rubriques-scroll">
          <ul className="rubriques-list">
            {items.map((it, idx) => {
              const id = it.id ?? idx;
              const isActive = id === activeId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`rubrique-btn ${isActive ? "is-active" : ""}`}
                    onClick={() => onSelect && onSelect(id)}
                  >
                    <span className="rubrique-index">{idx}</span>
                    <span className="rubrique-texts">
                      <span className="rubrique-title">{it.title}</span>
                      {it.subtitle ? (
                        <span className="rubrique-subtitle">{it.subtitle}</span>
                      ) : null}
                    </span>
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
