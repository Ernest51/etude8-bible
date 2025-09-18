import React from "react";
import "./App.css";
import RubriquesInline from "./RubriquesInline";

const BOOKS = [
  "Genèse","Exode","Lévitique","Nombres","Deutéronome","Josué","Juges","Ruth",
  "1 Samuel","2 Samuel","1 Rois","2 Rois","1 Chroniques","2 Chroniques","Esdras",
  "Néhémie","Esther","Job","Psaumes","Proverbes","Ecclésiaste","Cantique",
  "Ésaïe","Jérémie","Lamentations","Ézéchiel","Daniel","Osée","Joël","Amos",
  "Abdias","Jonas","Michée","Nahum","Habacuc","Sophonie","Aggée","Zacharie",
  "Malachie","Matthieu","Marc","Luc","Jean","Actes","Romains","1 Corinthiens",
  "2 Corinthiens","Galates","Éphésiens","Philippiens","Colossiens",
  "1 Thessaloniciens","2 Thessaloniciens","1 Timothée","2 Timothée","Tite",
  "Philémon","Hébreux","Jacques","1 Pierre","2 Pierre","1 Jean","2 Jean",
  "3 Jean","Jude","Apocalypse"
];

// 29 rubriques (0..28)
const RUBRIQUES = [
  "Étude verset par verset","Prière d'ouverture","Structure littéraire",
  "Questions du chapitre précédent","Thème doctrinal","Fondements théologiques",
  "Contexte historique","Contexte culturel","Contexte géographique",
  "Analyse lexicale","Parallèles bibliques","Prophétie et accomplissement",
  "Personnages","Structure rhétorique","Théologie trinitaire","Christ au centre",
  "Évangile et grâce","Application personnelle","Application communautaire",
  "Prière de réponse","Questions d'étude","Points de vigilance",
  "Objections et réponses","Perspective missionnelle","Éthique chrétienne",
  "Louange / liturgie","Méditation guidée","Mémoire / versets clés","Plan d'action"
].map((t, i) => ({ id: i, title: t }));

export default function App() {
  // passage
  const [book, setBook] = React.useState("Jean");
  const [chapter, setChapter] = React.useState(3);
  const [verse, setVerse] = React.useState(16);
  const [version, setVersion] = React.useState("LSG");
  const [tokens, setTokens] = React.useState(500);
  const [chatgpt, setChatgpt] = React.useState(true);

  // UI
  const [progress, setProgress] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [activeId, setActiveId] = React.useState(0);
  const [content, setContent] = React.useState("");

  const passageLabel = `${book} ${chapter}:${verse} ${version}`;

  function handleValidate() {
    // mini feedback
    setProgress((p) => (p < 15 ? 15 : p));
  }

  function handleReset() {
    setBook("Jean"); setChapter(3); setVerse(16); setVersion("LSG"); setTokens(500);
    setChatgpt(true); setProgress(0); setSearch(""); setActiveId(0); setContent("");
  }

  function handleLastStudy() {
    try {
      localStorage.setItem("lastStudy", JSON.stringify({ book, chapter, verse, version, tokens, chatgpt }));
    } catch {}
  }

  function handleReadBible() {
    const q = encodeURIComponent(`${book} ${chapter}:${verse} ${version}`);
    window.open(`https://www.bible.com/fr/search/bible?query=${q}`, "_blank");
  }

  async function handleGenerate() {
    // imitation “progression”
    setProgress(5);
    await wait(200);
    setProgress(25);
    await wait(250);
    setProgress(60);
    await wait(350);
    setProgress(100);

    setContent(
      `🙏 Méditation sur ${passageLabel}\n\n- Dieu aime, Dieu donne, la foi reçoit.\n- La vie éternelle commence déjà par la communion avec le Fils.\n\nPrière : Seigneur, apprends-moi à répondre à ton amour aujourd'hui. Amen.`
    );
  }

  function goPrev() { setActiveId((i) => Math.max(0, i - 1)); }
  function goNext() { setActiveId((i) => Math.min(RUBRIQUES.length - 1, i + 1)); }

  return (
    <div className="page-wrap">
      {/* Top header “0%” + gradient progress like screenshot */}
      <div className="topband">
        <div className="progress-bubble">{Math.round(progress)}%</div>
        <div className="progress-card">
          <div className="progress-gradient">
            <div className="progress-knob" />
          </div>
          <div className="progress-dots">
            {[...Array(12)].map((_, i) => <span key={i} />)}
          </div>
        </div>
      </div>

      {/* Controls block */}
      <div className="controls-card">
        <div className="search-row">
          <input
            className="pill-input"
            placeholder="Rechercher (ex : Marc 5:1, 1 Jean 2, Genèse 1:1-5)"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
          <button className="pill-btn primary" onClick={handleValidate}>Valider</button>
          <button className="pill-btn" onClick={handleReadBible}>Lire la Bible</button>
        </div>

        <div className="pills-row">
          <SelectPill label="Livre" value={book} onChange={setBook} options={BOOKS} />
          <NumberPill label="Chapitre" value={chapter} onChange={setChapter} min={1} max={150} />
          <NumberPill label="Verset" value={verse} onChange={setVerse} min={1} max={176} />
          <SelectPill label="Version" value={version} onChange={setVersion} options={["LSG","NEG79","BDS"]} />
          <NumberPill label="Tokens" value={tokens} onChange={setTokens} min={128} max={2048} step={64} />
          <TogglePill label="ChatGPT" enabled={chatgpt} onToggle={()=>setChatgpt(v=>!v)} />
          <button className="pill-btn" onClick={handleLastStudy}>Dernière étude</button>
          <button className="pill-btn" onClick={handleReset}>Reset</button>
          <button className="pill-btn">Versets</button>
          <button className="pill-btn accent" onClick={handleGenerate}>Générer</button>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="two-cols">
        {/* Left: Rubriques (29) with elevator */}
        <aside className="left-card">
          <div className="left-header">Rubriques ({RUBRIQUES.length})</div>
          <RubriquesInline
            items={RUBRIQUES}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </aside>

        {/* Right: content */}
        <section className="right-card">
          <div className="right-head">
            <h3>
              {activeId}. {RUBRIQUES[activeId]?.title || "Rubrique"}
            </h3>
            <div className="right-nav">
              <button className="mini-pill" onClick={goPrev}>◂ Précédent</button>
              <button className="mini-pill" onClick={goNext}>Suivant ▸</button>
            </div>
          </div>

          <div className="welcome">
            <h1>🙏 Bienvenue dans votre Espace d'Étude</h1>
            <p>Cet outil vous accompagne dans une méditation biblique structurée et claire.</p>
          </div>

          <div className="section">
            {content ? (
              <pre className="content-pre">{content}</pre>
            ) : (
              <p className="muted">
                Sélectionnez une rubrique puis cliquez sur <b>Générer</b> pour afficher du contenu
                pour <i>{passageLabel}</i>.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------- UI sub-components -------------------- */

function SelectPill({ label, value, onChange, options }) {
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={(e)=>onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}

function NumberPill({ label, value, onChange, min=1, max=100, step=1 }) {
  const list = [];
  for (let i=min; i<=max; i+=step) list.push(i);
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={(e)=>onChange(Number(e.target.value))}
      >
        {list.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}

function TogglePill({ label, enabled, onToggle }) {
  return (
    <button
      className={`pill toggle ${enabled ? "on" : ""}`}
      onClick={onToggle}
      type="button"
    >
      <span className="pill-label">{label}</span>
      <span className={`switch ${enabled ? "sw-on" : ""}`}>
        <span className="dot" />
      </span>
    </button>
  );
}

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
