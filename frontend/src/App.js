import React from "react";
import "./App.css";
import "./rubriques.css";
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

const BOOK_CHAPTERS = {
  "Genèse": 50, "Exode": 40, "Lévitique": 27, "Nombres": 36, "Deutéronome": 34,
  "Josué": 24, "Juges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Rois": 22, "2 Rois": 25, "1 Chroniques": 29, "2 Chroniques": 36, "Esdras": 10,
  "Néhémie": 13, "Esther": 10, "Job": 42, "Psaumes": 150, "Proverbes": 31,
  "Ecclésiaste": 12, "Cantique": 8, "Ésaïe": 66, "Jérémie": 52, "Lamentations": 5,
  "Ézéchiel": 48, "Daniel": 12, "Osée": 14, "Joël": 3, "Amos": 9,
  "Abdias": 1, "Jonas": 4, "Michée": 7, "Nahum": 3, "Habacuc": 3,
  "Sophonie": 3, "Aggée": 2, "Zacharie": 14, "Malachie": 4, "Matthieu": 28,
  "Marc": 16, "Luc": 24, "Jean": 21, "Actes": 28, "Romains": 16,
  "1 Corinthiens": 16, "2 Corinthiens": 13, "Galates": 6, "Éphésiens": 6, "Philippiens": 4,
  "Colossiens": 4, "1 Thessaloniciens": 5, "2 Thessaloniciens": 3, "1 Timothée": 6, "2 Timothée": 4,
  "Tite": 3, "Philémon": 1, "Hébreux": 13, "Jacques": 5, "1 Pierre": 5,
  "2 Pierre": 3, "1 Jean": 5, "2 Jean": 1, "3 Jean": 1, "Jude": 1, "Apocalypse": 22
};

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
].map(function (t, i) { return { id: i, title: t }; });

function wait(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

export default function App() {
  // passage
  const [book, setBook] = React.useState("Jean");
  const [chapter, setChapter] = React.useState(3);
  const [verse, setVerse] = React.useState(16);
  const [version, setVersion] = React.useState("LSG");
  const [length, setLength] = React.useState(500);
  const [chatgpt, setChatgpt] = React.useState(true);

  // UI
  const [progress, setProgress] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [activeId, setActiveId] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [pageBackground, setPageBackground] = React.useState("#f7fbfb");

  var passageLabel = book + " " + chapter + ":" + verse + " " + version;

  // Fonction pour gérer les clics sur le gradient et changer la couleur de fond
  function handleGradientClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    // Définir les couleurs selon la position du clic
    let newColor, gradientEnd;
    if (percentage < 0.25) {
      newColor = "#dbeafe"; // Bleu plus visible
      gradientEnd = "#bfdbfe";
    } else if (percentage < 0.5) {
      newColor = "#e9d5ff"; // Violet plus visible  
      gradientEnd = "#ddd6fe";
    } else if (percentage < 0.75) {
      newColor = "#fed7aa"; // Orange plus visible
      gradientEnd = "#fdba74";
    } else {
      newColor = "#bbf7d0"; // Vert plus visible
      gradientEnd = "#86efac";
    }
    
    setPageBackground(newColor);
    console.log('Changing page background to:', newColor);
    
    // Appliquer immédiatement à la page
    const pageWrap = document.querySelector('.page-wrap');
    if (pageWrap) {
      pageWrap.style.background = `linear-gradient(180deg, ${newColor} 0%, ${gradientEnd} 100%)`;
    }
  }

  // Fonction pour changer de livre et ajuster le chapitre si nécessaire
  function handleBookChange(newBook) {
    setBook(newBook);
    const maxChapters = BOOK_CHAPTERS[newBook] || 150;
    if (chapter > maxChapters) {
      setChapter(1);
    }
  }

  function handleValidate() {
    setProgress(function(p){ return p < 15 ? 15 : p; });
  }

  function handleReset() {
    setBook("Jean"); setChapter(3); setVerse(16); setVersion("LSG"); setLength(500);
    setChatgpt(true); setProgress(0); setSearch(""); setActiveId(0); setContent("");
  }

  function handleLastStudy() {
    try {
      const stored = localStorage.getItem("lastStudy");
      if (stored) {
        const data = JSON.parse(stored);
        setBook(data.book || "Jean");
        setChapter(data.chapter || 3);
        setVerse(data.verse || 16);
        setVersion(data.version || "LSG");
        setLength(data.length || 500);
        setChatgpt(data.chatgpt !== undefined ? data.chatgpt : true);
      }
    } catch (e) {
      console.error("Erreur lors du chargement de la dernière étude:", e);
    }
  }

  // Récupérer la dernière étude pour l'affichage
  function getLastStudyLabel() {
    try {
      const stored = localStorage.getItem("lastStudy");
      if (stored) {
        const data = JSON.parse(stored);
        return `${data.book || "Jean"} ${data.chapter || 3}`;
      }
    } catch (e) {}
    return "Dernière étude";
  }

  function handleReadBible() {
    var q = encodeURIComponent(passageLabel);
    window.open("https://www.bible.com/fr/search/bible?query=" + q, "_blank");
  }

  async function handleGenerate() {
    setProgress(5); await wait(200);
    setProgress(25); await wait(250);
    
    try {
      console.log('Making API call with payload:', {
        passage: passageLabel,
        version: version,
        tokens: length,
        model: chatgpt ? "gpt" : "claude",
        requestedRubriques: [activeId]
      });
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`/api/generate-study`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passage: passageLabel,
          version: version,
          tokens: length,
          model: chatgpt ? "gpt" : "claude",
          requestedRubriques: [activeId]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear timeout if request completes
      setProgress(60); await wait(350);
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data received:', !!data.content);
        setProgress(100);
        setContent(data.content || "Méditation générée avec succès");
        
        // Sauvegarder automatiquement la dernière étude
        try {
          localStorage.setItem("lastStudy", JSON.stringify({
            book: book, chapter: chapter, verse: verse, version: version, length: length, chatgpt: chatgpt
          }));
        } catch (e) {}
      } else {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Full error:', error);
      setProgress(100);
      if (error.name === 'AbortError') {
        setContent(
          "🙏 Méditation sur " + passageLabel +
          "\n\n- Dieu aime, Dieu donne, la foi reçoit." +
          "\n- La vie éternelle commence déjà par la communion avec le Fils." +
          "\n\nPrière : Seigneur, apprends-moi à répondre à ton amour aujourd'hui. Amen." +
          "\n\n[Note: Délai d'attente dépassé - utilisation du contenu de fallback]"
        );
      } else {
        setContent(
          "🙏 Méditation sur " + passageLabel +
          "\n\n- Dieu aime, Dieu donne, la foi reçoit." +
          "\n- La vie éternelle commence déjà par la communion avec le Fils." +
          "\n\nPrière : Seigneur, apprends-moi à répondre à ton amour aujourd'hui. Amen." +
          "\n\n[Note: Contenu de fallback - Erreur: " + error.message + "]"
        );
      }
    }
  }

  function goPrev() { setActiveId(function(i){ return Math.max(0, i - 1); }); }
  function goNext() { setActiveId(function(i){ return Math.min(RUBRIQUES.length - 1, i + 1); }); }

  return (
    <div className="page-wrap">
      {/* Bandeau haut (bulle %, barre gradient, points) */}
      <div className="topband">
        <div className="progress-bubble">{Math.round(progress)}%</div>
        <div className="progress-card">
          <div className="progress-gradient" onClick={handleGradientClick}>
          </div>
        </div>
      </div>

      {/* Bloc contrôles */}
      <div className="controls-card">
        <div className="search-row">
          <input
            className="pill-input"
            placeholder="Rechercher (ex : Marc 5:1, 1 Jean 2, Genèse 1:1-5)"
            value={search}
            onChange={function(e){ setSearch(e.target.value); }}
          />
          <button className="pill-btn primary" onClick={handleValidate}>Valider</button>
          <button className="pill-btn" onClick={handleReadBible}>Lire la Bible</button>
        </div>

        <div className="pills-row">
          <SelectPill label="Livre" value={book} onChange={handleBookChange} options={BOOKS} />
          <NumberPill label="Chapitre" value={chapter} onChange={setChapter} min={1} max={BOOK_CHAPTERS[book] || 150} />
          <NumberPill label="Verset" value={verse} onChange={setVerse} min={1} max={176} />
          <SelectPill label="Version" value={version} onChange={setVersion} options={["LSG","NEG79","BDS"]} />
          <SelectPill label="Longueur" value={length} onChange={setLength} options={[500,1500,2500]} />
          <button className="pill-btn" onClick={function(){ window.open('https://chatgpt.com/', '_blank'); }}>ChatGPT</button>
          <button className="pill-btn" onClick={handleLastStudy}>{getLastStudyLabel()}</button>
          <button className="pill-btn" onClick={handleReset}>Reset</button>
          <button className="pill-btn" onClick={function(){ setActiveId(0); }}>Versets</button>
          <button className="pill-btn accent" onClick={handleGenerate}>Générer</button>
        </div>
      </div>

      {/* 2 colonnes */}
      <div className="two-cols">
        <aside className="left-card">
          <div className="left-header">Rubriques ({RUBRIQUES.length})</div>
          <RubriquesInline
            items={RUBRIQUES}
            activeId={activeId}
            onSelect={function(id){ setActiveId(id); }}
          />
        </aside>

        <section className="right-card">
          <div className="right-head">
            <h3>{activeId}. {(RUBRIQUES[activeId] && RUBRIQUES[activeId].title) || "Rubrique"}</h3>
            <div className="right-nav">
              <button className="mini-pill" onClick={goPrev}>◂ Précédent</button>
              <button className="mini-pill" onClick={goNext}>Suivant ▸</button>
            </div>
          </div>

          <div className="welcome">
            <h1>🙏 Bienvenue dans votre Espace d'Étude</h1>
            <p>​Cet outil vous accompagne dans une méditation biblique structurée et claire.</p>
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

/* ---------- UI sub-components ---------- */

function SelectPill(props) {
  var label = props.label, value = props.value, onChange = props.onChange, options = props.options;
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={function(e){ onChange(e.target.value); }}
      >
        {options.map(function(opt){ return <option key={opt} value={opt}>{opt}</option>; })}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}

function NumberPill(props) {
  var label = props.label, value = props.value, onChange = props.onChange,
      min = props.min || 1, max = props.max || 100, step = props.step || 1;
  var list = []; for (var i=min; i<=max; i+=step) list.push(i);
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={function(e){ onChange(Number(e.target.value)); }}
      >
        {list.map(function(n){ return <option key={n} value={n}>{n}</option>; })}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}