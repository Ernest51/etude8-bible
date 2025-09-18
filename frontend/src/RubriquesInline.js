import React from "react";

/**
 * Colonne gauche : liste scrollable + sticky (styles dans App.css/rubriques.css)
 */
export default function RubriquesInline(props) {
  var items = props.items || [];
  var activeId = typeof props.activeId === "number" ? props.activeId : 0;
  var onSelect = props.onSelect;

  return (
    <div className="rubriques">
      <div className="rubriques-scroll">
        {items.map(function(it){
          var active = it.id === activeId;
          return (
            <button
              key={it.id}
              id={"rubrique-" + it.id}
              className={"rubrique" + (active ? " active" : "")}
              onClick={function(){ if (onSelect) onSelect(it.id); }}
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
