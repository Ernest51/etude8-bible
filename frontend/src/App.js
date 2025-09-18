import React from "react";
import "./App.css";
import "./rubriques.css";
import RubriquesInline from "./RubriquesInline";

const BOOKS = [
  "vide","Genèse","Exode","Lévitique","Nombres","Deutéronome","Josué","Juges","Ruth",
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
  "vide": 0, "Genèse": 50, "Exode": 40, "Lévitique": 27, "Nombres": 36, "Deutéronome": 34,
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
  const [book, setBook] = React.useState("vide");
  const [chapter, setChapter] = React.useState("vide");
  const [verse, setVerse] = React.useState("vide");
  const [version, setVersion] = React.useState("LSG");
  const [length, setLength] = React.useState(500);
  const [chatgpt, setChatgpt] = React.useState(true);

  // UI
  const [progress, setProgress] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [activeId, setActiveId] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [knobPosition, setKnobPosition] = React.useState(0);
  const [isResetting, setIsResetting] = React.useState(false);
  const [rubriquesStatus, setRubriquesStatus] = React.useState({});
  const [lastStudyLabel, setLastStudyLabel] = React.useState("Dernière étude");

  React.useEffect(() => {
    updateBackgroundColor(knobPosition);
    updateLastStudyLabel();
  }, []);

  React.useEffect(() => {
    updateBackgroundColor(knobPosition);
  }, [knobPosition]);

  function updateLastStudyLabel() {
    try {
      const stored = localStorage.getItem("lastStudy");
      if (stored) {
        const data = JSON.parse(stored);
        const label = `${data.book || "Jean"} ${data.chapter || 3}`;
        setLastStudyLabel(label);
      } else {
        setLastStudyLabel("Dernière étude");
      }
    } catch {
      setLastStudyLabel("Dernière étude");
    }
  }

  React.useEffect(() => {
    if (book !== "vide" && chapter !== "vide") {
      const newStatus = {};
      for (let i = 0; i < RUBRIQUES.length; i++) newStatus[i] = 'ready';
      setRubriquesStatus(newStatus);
    } else {
      setRubriquesStatus({});
    }
  }, [book, chapter]);

  var passageLabel = (book === "vide" || chapter === "vide" || verse === "vide") 
    ? "Sélectionnez un passage" 
    : book + " " + chapter + ":" + verse + " " + version;

  function updateBackgroundColor(percentage) {
    let newColor, gradientEnd, buttonColor, buttonColorHover, shadowColor;
    if (percentage < 25) {
      newColor = "#dbeafe"; gradientEnd = "#bfdbfe"; buttonColor = "#3b82f6"; buttonColorHover = "#2563eb"; shadowColor = "59, 130, 246";
    } else if (percentage < 50) {
      newColor = "#e9d5ff"; gradientEnd = "#ddd6fe"; buttonColor = "#8b5cf6"; buttonColorHover = "#7c3aed"; shadowColor = "139, 92, 246";
    } else if (percentage < 75) {
      newColor = "#fed7aa"; gradientEnd = "#fdba74"; buttonColor = "#f59e0b"; buttonColorHover = "#d97706"; shadowColor = "245, 158, 11";
    } else {
      newColor = "#bbf7d0"; gradientEnd = "#86efac"; buttonColor = "#10b981"; buttonColorHover = "#059669"; shadowColor = "16, 185, 129";
    }
    const pageWrap = document.querySelector('.page-wrap');
    if (pageWrap) pageWrap.style.background = `linear-gradient(180deg, ${newColor} 0%, ${gradientEnd} 100%)`;
    const root = document.documentElement;
    root.style.setProperty('--dynamic-button-color', buttonColor);
    root.style.setProperty('--dynamic-button-hover', buttonColorHover);
    root.style.setProperty('--dynamic-shadow-color', shadowColor);
  }

  function handleBookChange(newBook) {
    setBook(newBook);
    if (newBook === "vide") setChapter("vide");
    else {
      const maxChapters = BOOK_CHAPTERS[newBook] || 150;
      if (chapter === "vide" || chapter > maxChapters) setChapter(1);
    }
  }

  async function handleGenerate() {
    if (book === "vide" || chapter === "vide" || verse === "vide") {
      setContent("⚠️ Veuillez d'abord sélectionner un livre, un chapitre et un verset.");
      return;
    }
    setProgress(5); await wait(200);
    setProgress(25); await wait(250);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const isVerseByVerse = activeId === 0;
      const endpoint = isVerseByVerse ? '/api/generate-verse-by-verse' : '/api/generate-study';
      const payload = isVerseByVerse ? {
        passage: passageLabel,
        version: version
      } : {
        passage: passageLabel,
        version: version,
        tokens: length,
        model: chatgpt ? "gpt" : "claude",
        requestedRubriques: [activeId]
      };
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setProgress(60); await wait(350);
      if (response.ok) {
        const data = await response.json();
        setProgress(100);
        setContent(data.content || "Méditation générée avec succès");
      } else {
        setContent(`Erreur ${response.status}: ${await response.text()}`);
      }
    } catch (err) {
      setContent("⚠️ Erreur API: " + err.message);
    }
  }

  const handleVersetsClick = async () => {
    setActiveId(0);
    await wait(300);
    await handleGenerate();
  };

  function formatContent(text) {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="content-formatted-inner">
        {lines.map((line, i) => line.trim()
          ? <div key={i} className={line.startsWith('**') ? "content-bold" : "content-line"}>{line.replace(/\*\*/g,'')}</div>
          : <div key={i} className="content-space"></div>
        )}
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="controls-card">
        <div className="pills-row">
          <button 
            className={`pill-btn special ${activeId === 0 ? 'active' : ''}`} 
            onClick={handleVersetsClick}
          >
            📖 Versets
          </button>
          <button className="pill-btn accent" onClick={handleGenerate}>Générer</button>
        </div>
      </div>
      <div className="two-cols">
        <aside className="left-card">
          <RubriquesInline items={RUBRIQUES} activeId={activeId} onSelect={setActiveId} rubriquesStatus={rubriquesStatus}/>
        </aside>
        <section className="right-card">
          <div className="section">
            {content ? <div className="content-formatted">{formatContent(content)}</div> : <p>Sélectionnez une rubrique puis cliquez sur Générer.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
