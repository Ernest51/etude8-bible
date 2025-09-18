import React from "react";

/**
 * Liste des rubriques à gauche, scrollable + sticky comme la capture.
 * Ascenseur natif, styles fournis par App.css.
 */
export default function RubriquesInline({ items = [], activeId = 0, onSelect }) {
  return (
    <div className="rubriques">
      <div className="rubriques-scroll">
        {items.map((it) => {
          const active = it.id === activeId;
          return (
            <button
              key={it.id}
              id={`rubrique-${it.id}`}
              className={`rubrique ${active ? "active" : ""}`}
              onClick={()=>onSelect?.(it.id)}
              type="button"
            >
              <span className="idx">{it.id}</span>
              <span className="r-texts">
                <span className="r-title">{it.title}</span>
                <span className="r-sub">Cliquez pour voir le contenu détaillé.</span>
              </span>
              <span className="status-dot" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
