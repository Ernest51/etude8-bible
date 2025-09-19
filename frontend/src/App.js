import React from "react";
import "./App.css";
import "./rubriques.css";
import RubriquesInline from "./RubriquesInline";

/* ================== DONNÉES ================== */
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
].map((t, i) => ({ id: i, title: t }));

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

/* =======================================================
   APP
   ======================================================= */
export default function App() {
  // Passage
  const [book, setBook] = React.useState("vide");
  const [chapter, setChapter] = React.useState("vide");
  const [verse, setVerse] = React.useState("vide");
  const [version, setVersion] = React.useState("LSG"); // affichage seulement (non concaténé à 'passage')
  const [length, setLength] = React.useState(500);
  const [chatgpt, setChatgpt] = React.useState(true);  // laissé pour compat UI

  // UI
  const [progress, setProgress] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [activeId, setActiveId] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [knobPosition, setKnobPosition] = React.useState(0);
  const [rubriquesStatus, setRubriquesStatus] = React.useState({});
  const [lastStudyLabel, setLastStudyLabel] = React.useState("Dernière étude");
  const [loading, setLoading] = React.useState(false);

  // Init
  React.useEffect(() => { updateBackgroundColor(knobPosition); updateLastStudyLabel(); }, []);
  React.useEffect(() => { updateBackgroundColor(knobPosition); }, [knobPosition]);

  // LEDs rubriques
  React.useEffect(() => {
    if (book !== "vide" && chapter !== "vide") {
      const newStatus = {};
      for (let i = 0; i < RUBRIQUES.length; i++) newStatus[i] = 'ready';
      setRubriquesStatus(newStatus);
    } else {
      setRubriquesStatus({});
    }
  }, [book, chapter]);

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

  // -------- passageLabel (affichage) --------
  const passageLabel =
    (book === "vide" || chapter === "vide")
      ? "Sélectionnez un passage"
      : (verse === "vide"
          ? `${book} ${chapter} ${version}`
          : `${book} ${chapter}:${verse} ${version}`);

  /* ================== Palette / UI ================== */
  function handleGradientClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = (x / width) * 100;
    setKnobPosition(Math.max(0, Math.min(100, percentage)));
    updateBackgroundColor(percentage);
  }
  function handleKnobMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    const gradient = e.currentTarget.parentElement;
    const rect = gradient.getBoundingClientRect();
    function handleMouseMove(moveEvent) {
      const x = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setKnobPosition(percentage);
      updateBackgroundColor(percentage);
    }
    function handleMouseUp() {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  function updateBackgroundColor(percentage) {
    let newColor, gradientEnd, buttonColor, buttonColorHover, shadowColor;
    if (percentage < 25) {
      newColor = "#dbeafe"; gradientEnd = "#bfdbfe";
      buttonColor = "#3b82f6"; buttonColorHover = "#2563eb"; shadowColor = "59, 130, 246";
    } else if (percentage < 50) {
      newColor = "#e9d5ff"; gradientEnd = "#ddd6fe";
      buttonColor = "#8b5cf6"; buttonColorHover = "#7c3aed"; shadowColor = "139, 92, 246";
    } else if (percentage < 75) {
      newColor = "#fed7aa"; gradientEnd = "#fdba74";
      buttonColor = "#f59e0b"; buttonColorHover = "#d97706"; shadowColor = "245, 158, 11";
    } else {
      newColor = "#bbf7d0"; gradientEnd = "#86efac";
      buttonColor = "#10b981"; buttonColorHover = "#059669"; shadowColor = "16, 185, 129";
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
    if (newBook === "vide") {
      setChapter("vide");
    } else {
      const maxChapters = BOOK_CHAPTERS[newBook] || 150;
      if (chapter === "vide" || chapter > maxChapters) setChapter(1);
    }
  }

  // Recherche rapide (barre de recherche)
  function handleValidate() {
    if (!search.trim()) {
      setProgress(p => p < 15 ? 15 : p);
      return;
    }
    const searchText = search.trim().toLowerCase();

    const bookMapping = {
      'genese': 'Genèse', 'genesis': 'Genèse',
      'exode': 'Exode', 'exodus': 'Exode',
      'levitique': 'Lévitique', 'leviticus': 'Lévitique',
      'nombres': 'Nombres', 'numbers': 'Nombres',
      'deuteronome': 'Deutéronome', 'deuteronomy': 'Deutéronome',
      'josue': 'Josué', 'joshua': 'Josué',
      'juges': 'Juges', 'judges': 'Juges',
      'ruth': 'Ruth',
      '1 samuel': '1 Samuel', '1samuel': '1 Samuel',
      '2 samuel': '2 Samuel', '2samuel': '2 Samuel',
      '1 rois': '1 Rois', '1rois': '1 Rois', '1 kings': '1 Rois',
      '2 rois': '2 Rois', '2rois': '2 Rois', '2 kings': '2 Rois',
      '1 chroniques': '1 Chroniques', '1chroniques': '1 Chroniques',
      '2 chroniques': '2 Chroniques', '2chroniques': '2 Chroniques',
      'esdras': 'Esdras', 'ezra': 'Esdras',
      'nehemie': 'Néhémie', 'nehemiah': 'Néhémie',
      'esther': 'Esther',
      'job': 'Job',
      'psaumes': 'Psaumes', 'psalms': 'Psaumes',
      'proverbes': 'Proverbes', 'proverbs': 'Proverbes',
      'ecclesiaste': 'Ecclésiaste', 'ecclesiastes': 'Ecclésiaste',
      'cantique': 'Cantique', 'song': 'Cantique',
      'esaie': 'Ésaïe', 'isaiah': 'Ésaïe',
      'jeremie': 'Jérémie', 'jeremiah': 'Jérémie',
      'lamentations': 'Lamentations',
      'ezechiel': 'Ézéchiel', 'ezekiel': 'Ézéchiel',
      'daniel': 'Daniel',
      'osee': 'Osée', 'hosea': 'Osée',
      'joel': 'Joël',
      'amos': 'Amos',
      'abdias': 'Abdias', 'obadiah': 'Abdias',
      'jonas': 'Jonas', 'jonah': 'Jonas',
      'michee': 'Michée', 'micah': 'Michée',
      'nahum': 'Nahum',
      'habacuc': 'Habacuc', 'habakkuk': 'Habacuc',
      'sophonie': 'Sophonie', 'zephaniah': 'Sophonie',
      'aggee': 'Aggée', 'haggai': 'Aggée',
      'zacharie': 'Zacharie', 'zechariah': 'Zacharie',
      'malachie': 'Malachie', 'malachi': 'Malachie',
      'matthieu': 'Matthieu', 'matthew': 'Matthieu', 'matt': 'Matthieu',
      'marc': 'Marc', 'mark': 'Marc',
      'luc': 'Luc', 'luke': 'Luc',
      'jean': 'Jean', 'john': 'Jean',
      'actes': 'Actes', 'acts': 'Actes',
      'romains': 'Romains', 'romans': 'Romains', 'rom': 'Romains',
      '1 corinthiens': '1 Corinthiens', '1corinthiens': '1 Corinthiens', '1 cor': '1 Corinthiens',
      '2 corinthiens': '2 Corinthiens', '2corinthiens': '2 Corinthiens', '2 cor': '2 Corinthiens',
      'galates': 'Galates', 'galatians': 'Galates', 'gal': 'Galates',
      'ephesiens': 'Éphésiens', 'ephesians': 'Éphésiens', 'eph': 'Éphésiens',
      'philippiens': 'Philippiens', 'philippians': 'Philippiens', 'phil': 'Philippiens',
      'colossiens': 'Colossiens', 'colossians': 'Colossiens', 'col': 'Colossiens',
      '1 thessaloniciens': '1 Thessaloniciens', '1thessaloniciens': '1 Thessaloniciens', '1 thess': '1 Thessaloniciens',
      '2 thessaloniciens': '2 Thessaloniciens', '2thessaloniciens': '2 Thessaloniciens', '2 thess': '2 Thessaloniciens',
      '1 timothee': '1 Timothée', '1timothee': '1 Timothée', '1 tim': '1 Timothée',
      '2 timothee': '2 Timothée', '2timothee': '2 Timothée', '2 tim': '2 Timothée',
      'tite': 'Tite', 'titus': 'Tite',
      'philemon': 'Philémon',
      'hebreux': 'Hébreux', 'hebrews': 'Hébreux', 'heb': 'Hébreux',
      'jacques': 'Jacques', 'james': 'Jacques',
      '1 pierre': '1 Pierre', '1pierre': '1 Pierre', '1 peter': '1 Pierre',
      '2 pierre': '2 Pierre', '2pierre': '2 Pierre', '2 peter': '2 Pierre',
      '1 jean': '1 Jean', '1jean': '1 Jean', '1 john': '1 Jean',
      '2 jean': '2 Jean', '2jean': '2 Jean', '2 john': '2 Jean',
      '3 jean': '3 Jean', '3jean': '3 Jean', '3 john': '3 Jean',
      'jude': 'Jude',
      'apocalypse': 'Apocalypse', 'revelation': 'Apocalypse', 'rev': 'Apocalypse'
    };

    let foundBook = null;
    let foundChapter = "vide";
    let foundVerse = "vide";

    const pattern1 = searchText.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (pattern1) {
      const bookName = pattern1[1].trim();
      foundBook = bookMapping[bookName];
      if (foundBook) {
        foundChapter = parseInt(pattern1[2], 10);
        foundVerse = parseInt(pattern1[3], 10);
      }
    }

    if (!foundBook) {
      const pattern2 = searchText.match(/^(.+?)\s+(\d+)$/);
      if (pattern2) {
        const bookName = pattern2[1].trim();
        foundBook = bookMapping[bookName];
        if (foundBook) {
          foundChapter = parseInt(pattern2[2], 10);
          foundVerse = "vide";
        }
      }
    }

    if (!foundBook) {
      const bookName = searchText.trim();
      foundBook = bookMapping[bookName];
      if (foundBook) {
        foundChapter = 1;
        foundVerse = 1;
      }
    }

    if (foundBook) {
      setBook(foundBook);
      setChapter(foundChapter);
      setVerse(foundVerse);
      setSearch("");
      setProgress(50);
      setTimeout(() => setProgress(0), 800);
    } else {
      setProgress(p => p < 15 ? 15 : p);
    }
  }

  function handleReset() {
    setBook("vide");
    setChapter("vide");
    setVerse("vide");
    setVersion("LSG");
    setLength(500);
    setChatgpt(true);
    setProgress(0);
    setSearch("");
    setActiveId(0);
    setContent("");
    setKnobPosition(0);
    setRubriquesStatus({});
    updateBackgroundColor(0);
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

  function handleReadBible() {
    const q = encodeURIComponent(passageLabel);
    window.open("https://www.bible.com/fr/search/bible?query=" + q, "_blank");
  }

  /* ================== BACKEND URL ================== */
  const backendUrl =
    (process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
    "https://etude8-bible-api-production.up.railway.app";

  /* =============== Helper Fetch JSON (timeout) =============== */
  async function fetchJson(url, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const text = await res.text();
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      try {
        return JSON.parse(text);
      } catch {
        return { content: text || "" };
      }
    } finally {
      clearTimeout(id);
    }
  }

  /* ================== ÉTUDE 28 POINTS ================== */
  async function handleGenerate() {
    if (book === "vide" || chapter === "vide") {
      setContent("⚠️ Veuillez d'abord sélectionner au moins un livre et un chapitre.");
      setProgress(0);
      return;
    }

    // ❗ passage SANS version
    const passageForApi = (verse === "vide") ? `${book} ${chapter}` : `${book} ${chapter}:${verse}`;

    setLoading(true);
    setProgress(5); await wait(150);
    setProgress(25); await wait(200);

    try {
      const body = {
        passage: passageForApi,         // ex: "Nombres 2"
        version: "",                    // champ requis (ignoré côté server.py)
        tokens: Number(length) || 500,  // compat schéma
        model: "darby",                 // étiquette simple
        requestedRubriques: Array.from({ length: 28 }, (_, i) => i) // 0..27
      };

      // ❗ Route existante sur Railway (alias de /api/generate-28 ajouté côté backend)
      const data = await fetchJson(`${backendUrl}/api/generate-study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      setProgress(100);
      setContent(data.content || "Étude générée avec succès.");

      try {
        localStorage.setItem("lastStudy", JSON.stringify({ book, chapter, verse, version, length, chatgpt }));
        updateLastStudyLabel();
      } catch {}
    } catch (error) {
      console.error("Erreur génération 28:", error);
      setProgress(100);
      setContent(`⚠️ Erreur: ${error.message || "échec de génération (28 points)"}`);
    } finally {
      setLoading(false);
    }
  }

  /* ================== VERSET PAR VERSET ================== */
  const generateVerseByVerse = async () => {
    setLoading(true);
    setProgress(5); await wait(150);
    setProgress(25); await wait(200);

    try {
      const hasSelection = (book !== "vide" && chapter !== "vide");
      // ❗ passage SANS version
      const passageForApi = hasSelection
        ? `${book} ${chapter}${(verse !== "vide") ? (":" + verse) : ""}`
        : "Genèse 1";

      const data = await fetchJson(`${backendUrl}/api/generate-verse-by-verse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passage: passageForApi, version: "" })
      });

      setProgress(100);
      let formatted = data.content || "Étude verset par verset générée avec succès";

      // Lisibilité (gras)
      formatted = formatted
        .replace(/VERSET (\d+)/g, '**VERSET $1**')
        .replace(/TEXTE BIBLIQUE\s*:/g, '**TEXTE BIBLIQUE :**')
        .replace(/EXPLICATION THÉOLOGIQUE\s*:/g, '**EXPLICATION THÉOLOGIQUE :**')
        .replace(/Introduction au Chapitre/g, '**Introduction au Chapitre**');

      setContent(formatted);
      setRubriquesStatus(prev => ({ ...prev, 0: 'completed' }));
    } catch (error) {
      console.error('Verse-by-verse error:', error);
      setProgress(100);
      setContent(`⚠️ Erreur: ${error.message || "échec de génération verset par verset."}`);
      setRubriquesStatus(prev => ({ ...prev, 0: 'completed' }));
    } finally {
      setLoading(false);
    }
  };

  const handleVersetsClick = async () => {
    setActiveId(0);

    let nextBook = book, nextChapter = chapter, nextVerse = verse;
    if (book === "vide" || chapter === "vide") {
      nextBook = "Genèse"; nextChapter = 1; nextVerse = 1;
      setBook(nextBook); setChapter(nextChapter); setVerse(nextVerse);
    }
    try {
      localStorage.setItem("lastStudy", JSON.stringify({
        book: nextBook,
        chapter: nextChapter,
        verse: (nextVerse === "vide" ? 1 : nextVerse),
        version: version || "LSG",
        length: length || 500,
        chatgpt: true
      }));
      updateLastStudyLabel();
    } catch {}

    await wait(250);
    await generateVerseByVerse();
  };

  function goPrev() { setActiveId(i => Math.max(0, i - 1)); }
  function goNext() { setActiveId(i => Math.min(RUBRIQUES.length - 1, i + 1)); }

  function formatContent(text) {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="content-formatted-inner">
        {lines.map((line, index) => {
          if (line.startsWith('**') && line.endsWith('**')) {
            const boldText = line.replace(/\*\*/g, '');
            return <div key={index} className="content-bold">{boldText}</div>;
          } else if (line.trim()) {
            return <div key={index} className="content-line">{line}</div>;
          } else {
            return <div key={index} className="content-space"></div>;
          }
        })}
      </div>
    );
  }

  /* ================== RENDER ================== */
  return (
    <div className="page-wrap">
      {/* HEADER */}
      <div className="header-marquee">
        <div className="marquee-container">
          <div className="marquee-content" data-text="✨ MEDITATION BIBLIQUE ✨ ÉTUDE SPIRITUELLE ✨ SAGESSE DIVINE ✨ MÉDITATION THÉOLOGIQUE ✨ CONTEMPLATION SACRÉE ✨ RÉFLEXION INSPIRÉE ✨">
            ✨ MEDITATION BIBLIQUE ✨ ÉTUDE SPIRITUELLE ✨ SAGESSE DIVINE ✨ MÉDITATION THÉOLOGIQUE ✨ CONTEMPLATION SACRÉE ✨ RÉFLEXION INSPIRÉE ✨
          </div>
        </div>
        {loading && <p className="header-subtitle">Génération en cours…</p>}
      </div>

      {/* TOPBAND */}
      <div className="topband">
        <div className="progress-bubble">{Math.round(progress)}%</div>
        <div className="progress-card">
          <div className="progress-gradient" onClick={handleGradientClick}>
            <div
              className="color-knob"
              style={{left: `${knobPosition}%`}}
              onMouseDown={handleKnobMouseDown}
              tabIndex={0}
            />
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="controls-card">
        <div className="search-row">
          <input
            className="pill-input"
            placeholder="Rechercher (ex : Marc 5:1, 1 Jean 2, Genèse 1:1-5)"
            value={search}
            onChange={e => setSearch(e.target.value)}
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

          <button className="pill-btn" onClick={() => window.open('https://chatgpt.com/', '_blank')}>ChatGPT</button>
          <button className="pill-btn" onClick={handleLastStudy}>{lastStudyLabel}</button>
          <button className="pill-btn reset" onClick={handleReset} disabled={loading}>🔄 Reset</button>

          <button
            className={`pill-btn special ${activeId === 0 ? 'active' : ''}`}
            onClick={handleVersetsClick}
            disabled={loading}
          >
            📖 Versets
          </button>

          <button className="pill-btn accent" onClick={handleGenerate} disabled={loading}>Générer</button>
        </div>
      </div>

      {/* 2 colonnes */}
      <div className="two-cols">
        <aside className="left-card">
          <div className="left-header">Rubriques ({RUBRIQUES.length})</div>
          <RubriquesInline
            items={RUBRIQUES}
            activeId={activeId}
            onSelect={id => setActiveId(id)}
            rubriquesStatus={rubriquesStatus}
          />
        </aside>

        <section className="right-card">
          <div className="right-head">
            <h3>{activeId}. {(RUBRIQUES[activeId] && RUBRIQUES[activeId].title) || "Rubrique"}</h3>
            <div className="right-nav">
              <button className="mini-pill" onClick={goPrev} disabled={activeId === 0}>◂ Précédent</button>
              <button className="mini-pill" onClick={goNext} disabled={activeId === RUBRIQUES.length - 1}>Suivant ▸</button>
            </div>
          </div>

          <div className="welcome" style={{display: content ? 'none' : 'block'}}>
            <h1>🙏 Bienvenue dans votre Espace d'Étude</h1>
            <p>​Cet outil vous accompagne dans une méditation biblique structurée et claire.</p>
          </div>

          <div className="section">
            {content ? (
              <div className="content-formatted">
                {formatContent(content)}
              </div>
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
  const { label, value, onChange, options } = props;
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}

function NumberPill(props) {
  const { label, value, onChange, min = 1, max = 100, step = 1 } = props;
  const list = ["vide"];
  for (let i = min; i <= max; i += step) list.push(i);
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={e => {
          const val = e.target.value;
          onChange(val === "vide" ? "vide" : Number(val));
        }}
      >
        {list.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}
