import React from "react";
import RubriquesInline from "./RubriquesInline";
import "./App.css";        // on garde ton CSS existant
import "./rubriques.css";  // nouveau CSS pour la mise en page rubriques

// 28 rubriques par défaut (tu peux brancher ton tableau existant ici)
const RUBRIQUES = [
  'Étude verset par verset', "Prière d'ouverture", 'Structure littéraire',
  "Questions du chapitre précédent", 'Contexte historique et géographique',
  'Genre littéraire & style', 'Thèmes théologiques majeurs', 'Personnages et rôles',
  'Mot-clé et lexique', 'Analyse syntaxique', 'Originalité du texte',
  'Parallèles bibliques', 'Applications pratiques', 'Points de doctrine',
  'Perspectives patristiques', "Réception dans l'église", 'Problèmes herméneutiques',
  'Comparaison intertestamentaire', 'Éléments christologiques',
  'Saint-Esprit & pneumatologie', 'Éthique et comportement', 'Responsabilité du croyant',
  'Communauté de foi', 'Espérance eschatologique', 'Sagesse pratique',
  'Combat spirituel', 'Mystères & sacrements', 'Conclusion & prière de clôture'
];

export default function App() {
  // si tu as déjà ces états ailleurs, remplace-les par tes hooks existants
  const [filter, setFilter] = React.useState("");
  const [activeId, setActiveId] = React.useState(0);

  const wrapRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const rangeRef = React.useRef(null);

  const items = RUBRIQUES.map((t, i) => ({ id: i, title: t, subtitle: "" }));

  // synchronise le slider "ascenseur" avec le scroll de la colonne
  const syncRange = React.useCallback(() => {
    const wrap = wrapRef.current, range = rangeRef.current;
    if (!wrap || !range) return;
    const max = wrap.scrollHeight - wrap.clientHeight;
    const pct = max <= 0 ? 0 : Math.round((wrap.scrollTop / max) * 100);
    range.value = pct;
  }, []);

  const scrollSidebarBy = (dy) => wrapRef.current?.scrollBy({ top: dy, behavior: "smooth" });
  const scrollSidebarToPct = (pct) => {
    const wrap = wrapRef.current; if (!wrap) return;
    const max = wrap.scrollHeight - wrap.clientHeight;
    wrap.scrollTo({ top: Math.round(max * pct / 100), behavior: "auto" });
  };

  const setActiveIndex = (n) => {
    const maxIndex = items.length - 1;
    const idx = Math.max(0, Math.min(maxIndex, n));
    setActiveId(idx);

    // visibilité dans la sidebar
    const wrap = wrapRef.current;
    const card = document.getElementById("rubrique-" + idx);
    if (wrap && card) {
      const cardTop = card.offsetTop;
      const cardBottom = cardTop + card.offsetHeight;
      if (cardTop < wrap.scrollTop) wrap.scrollTo({ top: cardTop - 10, behavior: "smooth" });
      else if (cardBottom > wrap.scrollTop + wrap.clientHeight) {
        wrap.scrollTo({ top: cardBottom - wrap.clientHeight + 10, behavior: "smooth" });
      }
    }
    // scroll du contenu principal
    const target = document.getElementById("section-" + idx);
    if (target && contentRef.current) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // met à jour l’onglet actif quand on scrolle le contenu (droite)
  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const sections = Array.from(el.querySelectorAll(".section"));
      let act = 0;
      const baseTop = el.getBoundingClientRect().top;
      sections.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        if (r.top - baseTop <= 120) act = i;
      });
      setActiveId(act);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // init slider ascenseur
  React.useEffect(() => {
    const t = setTimeout(syncRange, 100);
    return () => clearTimeout(t);
  }, [syncRange]);

  const filtered = items.filter(({ title }) =>
    title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page">
      {/* Header compact (garde ton header si tu en as déjà un) */}
      <header className="header">
        <div className="header-inner">
          <h1 className="title">Méditation</h1>

          {/* zone d’actions : branche tes vrais boutons ici si besoin */}
          <div className="actions">
            <button className="btn" onClick={() => setActiveIndex(activeId - 1)}>◂ Précédent</button>
            <button className="btn" onClick={() => setActiveIndex(activeId + 1)}>Suivant ▸</button>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="rubriques-section">
          <h2 className="h2">Rubriques ({items.length})</h2>
          <p className="muted">Cliquez sur une rubrique dans la colonne de gauche pour afficher son contenu à droite.</p>

          <div className="rubriques-grid">
            {/* Colonne gauche : sticky + ascenseur + filtre + slider */}
            <div className="col-left">
              <div className="sidebar-card">
                <div className="controls">
                  <button className="btn" title="Monter" onClick={() => scrollSidebarBy(-160)}>▲</button>
                  <button className="btn" title="Descendre" onClick={() => scrollSidebarBy(160)}>▼</button>
                  <div className="search">
                    <input
                      placeholder="Trouver une rubrique…"
                      value={filter}
                      onChange={(e)=>setFilter(e.target.value)}
                    />
                  </div>
                  <input
                    ref={rangeRef}
                    type="range"
                    min="0" max="100" defaultValue="0"
                    className="range"
                    title="Ascenseur"
                    onInput={(e)=>scrollSidebarToPct(Number(e.target.value))}
                  />
                </div>

                {/* Liste scrollable */}
                <div
                  className="rubriques-wrap"
                  ref={wrapRef}
                  onScroll={syncRange}
                >
                  {filtered.map((it, i) => {
                    // on conserve l’index réel pour l’ancre de section
                    const idx = it.id;
                    return (
                      <div
                        key={idx}
                        id={"rubrique-"+idx}
                        className={"rubrique" + (activeId===idx ? " active" : "")}
                        onClick={()=>setActiveIndex(idx)}
                      >
                        <div className="index">{idx}</div>
                        <div className="meta">
                          <h4>{it.title}</h4>
                          <p>Courte description de la rubrique n°{idx} — cliquez pour aller à la section correspondante.</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Zone contenu à droite */}
            <div className="col-right">
              <div className="card content-card" ref={contentRef} tabIndex={0}>
                <div className="hero">
                  <h1>🙏 Bienvenue dans votre Espace d'Étude</h1>
                  <p className="muted">Méditez les Écritures avec une approche structurée et claire.</p>
                </div>

                {/* Sections liées aux rubriques */}
                {items.map((it) => (
                  <div key={it.id} className="section" id={"section-"+it.id}>
                    <h3>{it.id}. {it.title}</h3>
                    <p>
                      Contenu détaillé pour la rubrique « {it.title} ». Placez ici vos commentaires,
                      versets liés, notes, et questions interactives.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
