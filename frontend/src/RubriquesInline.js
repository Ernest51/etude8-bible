import React from "react";

/**
 * Colonne gauche : liste scrollable + sticky (styles dans App.css / rubriques.css)
 * Props:
 *  - items: [{ id:number, title:string }]
 *  - activeId: number
 *  - onSelect: (id:number) => void
 *  - rubriquesStatus: { id: 'ready'|'completed' }
 */
function RubriquesInline(props) {
  var items = Array.isArray(props.items) ? props.items : [];
  var activeId = typeof props.activeId === "number" ? props.activeId : 0;
  var onSelect = typeof props.onSelect === "function" ? props.onSelect : null;
  var rubriquesStatus = props.rubriquesStatus || {};

  function handleSelect(id) { if (onSelect) onSelect(id); }

  return (
    <div className="rubriques">
      <div className="rubriques-scroll">
        {items.map(function (it) {
          var isActive = it.id === activeId;
          var status = rubriquesStatus[it.id] || '';
          var dotClass = "status-dot" + (status ? " " + status : "");
          
          return (
            <button
              key={String(it.id)}
              id={"rubrique-" + String(it.id)}
              type="button"
              className={"rubrique" + (isActive ? " active" : "")}
              onClick={function () { handleSelect(it.id); }}
            >
              <span className="idx">{it.id}</span>
              <span className="r-texts">
                <span className="r-title">{it.title}</span>
                <span className="r-sub">Cliquez pour voir le contenu détaillé.</span>
              </span>
              <span className={dotClass} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RubriquesInline;
