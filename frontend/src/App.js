import React from "react";
import "./App.css";
import "./rubriques.css";
import RubriquesInline from "./RubriquesInline";

/* ---------- Constantes ---------- */

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

/* ---------- Utilitaires ---------- */

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

// BASE API nettoyée (retire tout / final pour éviter //api)
const API_BASE = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001').replace(/\/+$/,'');

/* ---------- Composant principal ---------- */

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

  React.useEffect(() => { updateBackgroundColor(knobPosition); updateLastStudyLabel(); }, []);
  React.useEffect(() => { updateBackgroundColor(knobPosition); }, [knobPosition]);

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

  const passageLabel =
    (book === "vide" || chapter === "vide" || verse === "vide")
      ? "Sélectionnez un passage"
      : `${book} ${chapter}:${verse} ${version}`;

  /* ---------- Couleurs / palette ---------- */

  function handleGradientClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = (x / width) * 100;
    setKnobPosition(Math.max(0, Math.min(100, percentage)));
    updateBackgroundColor(percentage);
  }

  function handleKnobMouseDown(e) {
    e.preventDefault(); e.stopPropagation();
    const gradient = e.currentTarget.parentElement;
    const rect = gradient.getBoundingClientRect();
    function handleMouseMove(moveEvent) {
      const x = moveEvent.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setKnobPosition(percentage); updateBackgroundColor(percentage);
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
      buttonColor = "#3b82f6"; buttonColorHover = "#2563eb";
      shadowColor = "59, 130, 246";
    } else if (percentage < 50) {
      newColor = "#e9d5ff"; gradientEnd = "#ddd6fe";
      buttonColor = "#8b5cf6"; buttonColorHover = "#7c3aed";
      shadowColor = "139, 92, 246";
    } else if (percentage < 75) {
      newColor = "#fed7aa"; gradientEnd = "#fdba74";
      buttonColor = "#f59e0b"; buttonColorHover = "#d97706";
      shadowColor = "245, 158, 11";
    } else {
      newColor = "#bbf7d0"; gradientEnd = "#86efac";
      buttonColor = "#10b981"; buttonColorHover = "#059669";
      shadowColor = "16, 185, 129";
    }
    const pageWrap = document.querySelector('.page-wrap');
    if (pageWrap) {
      pageWrap.style.background = `linear-gradient(180deg, ${newColor} 0%, ${gradientEnd} 100%)`;
    }
    const root = document.documentElement;
    root.style.setProperty('--dynamic-button-color', buttonColor);
    root.style.setProperty('--dynamic-button-hover', buttonColorHover);
    root.style.setProperty('--dynamic-shadow-color', shadowColor);
  }

  /* ---------- Sélection / recherche ---------- */

  function handleBookChange(newBook) {
    setBook(newBook);
    if (newBook === "vide") {
      setChapter("vide");
    } else {
      const maxChapters = BOOK_CHAPTERS[newBook] || 150;
      if (chapter === "vide" || chapter > maxChapters) setChapter(1);
    }
  }

  function handleValidate() {
    if (!search.trim()) { setProgress(p => (p < 15 ? 15 : p)); return; }
    const searchText = search.trim().toLowerCase();

    const bookMapping = {
      'genese':'Genèse','genesis':'Genèse','exode':'Exode','exodus':'Exode',
      'levitique':'Lévitique','leviticus':'Lévitique','nombres':'Nombres','numbers':'Nombres',
      'deuteronome':'Deutéronome','deuteronomy':'Deutéronome','josue':'Josué','joshua':'Josué',
      'juges':'Juges','judges':'Juges','ruth':'Ruth',
      '1 samuel':'1 Samuel','1samuel':'1 Samuel','2 samuel':'2 Samuel','2samuel':'2 Samuel',
      '1 rois':'1 Rois','1rois':'1 Rois','1 kings':'1 Rois','2 rois':'2 Rois','2rois':'2 Rois','2 kings':'2 Rois',
      '1 chroniques':'1 Chroniques','1chroniques':'1 Chroniques','2 chroniques':'2 Chroniques','2chroniques':'2 Chroniques',
      'esdras':'Esdras','ezra':'Esdras','nehemie':'Néhémie','nehemiah':'Néhémie','esther':'Esther','job':'Job',
      'psaumes':'Psaumes','psalms':'Psaumes','proverbes':'Proverbes','proverbs':'Proverbes',
      'ecclesiaste':'Ecclésiaste','ecclesiastes':'Ecclésiaste','cantique':'Cantique','song':'Cantique',
      'esaie':'Ésaïe','isaiah':'Ésaïe','jeremie':'Jérémie','jeremiah':'Jérémie','lamentations':'Lamentations',
      'ezechiel':'Ézéchiel','ezekiel':'Ézéchiel','daniel':'Daniel','osee':'Osée','hosea':'Osée','joel':'Joël','amos':'Amos',
      'abdias':'Abdias','obadiah':'Abdias','jonas':'Jonas','jonah':'Jonas','michee':'Michée','micah':'Michée',
      'nahum':'Nahum','habacuc':'Habacuc','habakkuk':'Habacuc','sophonie':'Sophonie','zephaniah':'Sophonie',
      'aggee':'Aggée','haggai':'Aggée','zacharie':'Zacharie','zechariah':'Zacharie','malachie':'Malachie','malachi':'Malachie',
      'matthieu':'Matthieu','matthew':'Matthieu','matt':'Matthieu','marc':'Marc','mark':'Marc','luc':'Luc','luke':'Luc',
      'jean':'Jean','john':'Jean','actes':'Actes','acts':'Actes','romains':'Romains','romans':'Romains','rom':'Romains',
      '1 corinthiens':'1 Corinthiens','1corinthiens':'1 Corinthiens','1 cor':'1 Corinthiens',
      '2 corinthiens':'2 Corinthiens','2corinthiens':'2 Corinthiens','2 cor':'2 Corinthiens',
      'galates':'Galates','galatians':'Galates','gal':'Galates','ephesiens':'Éphésiens','ephesians':'Éphésiens','eph':'Éphésiens',
      'philippiens':'Philippiens','philippians':'Philippiens','phil':'Philippiens','colossiens':'Colossiens','colossians':'Colossiens','col':'Colossiens',
      '1 thessaloniciens':'1 Thessaloniciens','1thessaloniciens':'1 Thessaloniciens','1 thess':'1 Thessaloniciens',
      '2 thessaloniciens':'2 Thessaloniciens','2thessaloniciens':'2 Thessaloniciens','2 thess':'2 Thessaloniciens',
      '1 timothee':'1 Timothée','1timothee':'1 Timothée','1 tim':'1 Timothée','2 timothee':'2 Timothée','2timothee':'2 Timothée','2 tim':'2 Timothée',
      'tite':'Tite','titus':'Tite','philemon':'Philémon','hebreux':'Hébreux','hebrews':'Hébreux','heb':'Hébreux',
      'jacques':'Jacques','james':'Jacques','1 pierre':'1 Pierre','1pierre':'1 Pierre','1 peter':'1 Pierre',
      '2 pierre':'2 Pierre','2pierre':'2 Pierre','2 peter':'2 Pierre',
      '1 jean':'1 Jean','1jean':'1 Jean','1 john':'1 Jean','2 jean':'2 Jean','2jean':'2 Jean','2 john':'2 Jean',
      '3 jean':'3 Jean','3jean':'3 Jean','3 john':'3 Jean','jude':'Jude','apocalypse':'Apocalypse','revelation':'Apocalypse','rev':'Apocalypse'
    };

    let foundBook = null, foundChapter = "vide", foundVerse = "vide";

    const pattern1 = searchText.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (pattern1) {
      const bookName = pattern1[1].trim();
      foundBook = bookMapping[bookName];
      if (foundBook) { foundChapter = parseInt(pattern1[2]); foundVerse = parseInt(pattern1[3]); }
    }
    if (!foundBook) {
      const pattern2 = searchText.match(/^(.+?)\s+(\d+)$/);
      if (pattern2) {
        const bookName = pattern2[1].trim();
        foundBook = bookMapping[bookName];
        if (foundBook) { foundChapter = parseInt(pattern2[2]); foundVerse = "vide"; }
      }
    }
    if (!foundBook) {
      const bookName = searchText.trim();
      foundBook = bookMapping[bookName];
      if (foundBook) { foundChapter = 1; foundVerse = 1; }
    }

    if (foundBook) {
      setBook(foundBook); setChapter(foundChapter); setVerse(foundVerse);
      setSearch(""); setProgress(50); setTimeout(() => setProgress(0), 1000);
    } else {
      setProgress(p => (p < 15 ? 15 : p));
    }
  }

  function handleReset() {
    setIsResetting(true);
    setBook("vide"); setChapter("vide"); setVerse("vide");
    setVersion("LSG"); setLength(500); setChatgpt(true);
    setProgress(0); setSearch(""); setActiveId(0); setContent("");
    setKnobPosition(0); setRubriquesStatus({});
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
    } catch {}
  }

  function handleReadBible() {
    const q = encodeURIComponent(passageLabel);
    window.open("https://www.bible.com/fr/search/bible?query=" + q, "_blank");
  }

  /* ---------- Appels backend ---------- */

  async function handleGenerate() {
    if (book === "vide" || chapter === "vide" || verse === "vide") {
      setContent("⚠️ Veuillez d'abord sélectionner un livre, un chapitre et un verset pour générer une étude biblique.");
      setProgress(0); return;
    }
    setProgress(5); await wait(200); setProgress(25); await wait(250);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const isVerseByVerse = activeId === 0;
      const endpoint = isVerseByVerse ? '/api/generate-verse-by-verse' : '/api/generate-study';
      const payload = isVerseByVerse
        ? { passage: `${book} ${chapter} ${version}`, version }
        : {
            passage: `${book} ${chapter}:${verse} ${version}`,
            version, tokens: length, model: chatgpt ? "gpt" : "claude",
            requestedRubriques: [activeId]
          };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal
      });

      clearTimeout(timeoutId);
      setProgress(60); await wait(350);

      if (response.ok) {
        const data = await response.json();
        setProgress(100); setContent(data.content || "Méditation générée avec succès");
        if (!isResetting) {
          try {
            localStorage.setItem("lastStudy", JSON.stringify({ book, chapter, verse, version, length, chatgpt }));
            updateLastStudyLabel();
          } catch {}
        } else { setIsResetting(false); }
      } else {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
    } catch (error) {
      setProgress(100);
      setContent(
        "🙏 Méditation sur " + passageLabel +
        "\n\n- Dieu aime, Dieu donne, la foi reçoit." +
        "\n- La vie éternelle commence déjà par la communion avec le Fils." +
        "\n\nPrière : Seigneur, apprends-moi à répondre à ton amour aujourd'hui. Amen." +
        "\n\n[Note: Contenu de fallback - Erreur: " + error.message + "]"
      );
    }
  }

  const generateVerseByVerse = async () => {
    if (book === "vide" || chapter === "vide") {
      setContent("⚠️ Veuillez d'abord sélectionner un livre et un chapitre (le verset peut rester vide) pour générer l'étude verset par verset.");
      return;
    }
    setProgress(5); await wait(200); setProgress(25); await wait(250);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE}/api/generate-verse-by-verse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: `${book} ${chapter} ${version}`, version }),
        signal: controller.signal
      });

      clearTimeout(timeoutId); setProgress(60); await wait(350);

      if (response.ok) {
        const data = await response.json();
        let txt = data.content || "Étude verset par verset générée avec succès";
        // Mise en forme minimale lisible
        txt = txt
          .replace(/^VERSET (\d+)/gmi, '**VERSET $1**')
          .replace(/^TEXTE BIBLIQUE\s*:/gmi, '**TEXTE BIBLIQUE :**')
          .replace(/^EXPLICATION THÉOLOGIQUE\s*:/gmi, '**EXPLICATION THÉOLOGIQUE :**')
          .replace(/^Introduction au Chapitre$/gmi, '**Introduction au Chapitre**')
          .replace(/^Synthèse Spirituelle$/gmi, '**Synthèse Spirituelle**')
          .replace(/^Principe Herméneutique$/gmi, '**Principe Herméneutique**');

        setProgress(100); setContent(txt);
        setRubriquesStatus(prev => ({ ...prev, 0: 'completed' }));
      } else {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      setProgress(100);
      setContent(`Étude Verset par Verset - ${book} Chapitre ${chapter}

Introduction au Chapitre

Cette étude examine chaque verset de ${book} ${chapter} selon les principes de l'exégèse grammatico-historique.

[Note: Erreur API - ${error.message}]`);
      setRubriquesStatus(prev => ({ ...prev, 0: 'completed' }));
    }
  };

  const handleVersetsClick = async () => {
    setActiveId(0);
    // Sauvegarde “dernière étude” (Livre + Chapitre suffisent ici)
    try {
      localStorage.setItem("lastStudy", JSON.stringify({
        book, chapter, verse: verse, version, length, chatgpt
      }));
      updateLastStudyLabel();
    } catch {}
    await wait(200);
    await generateVerseByVerse();
  };

  function goPrev() { setActiveId(i => Math.max(0, i - 1)); }
  function goNext() { setActiveId(i => Math.min(RUBRIQUES.length - 1, i + 1)); }

  /* ---------- Rendu formaté ---------- */

  function formatContent(text) {
    if (!text) return null;

    // Renforce le style sans toucher à la donnée
    const enhanced = text
      .replace(/^VERSET (\d+)/gmi, '**VERSET $1**')
      .replace(/^TEXTE BIBLIQUE\s*:/gmi, '**TEXTE BIBLIQUE :**')
      .replace(/^EXPLICATION THÉOLOGIQUE\s*:/gmi, '**EXPLICATION THÉOLOGIQUE :**')
      .replace(/^Introduction au Chapitre$/gmi, '**Introduction au Chapitre**')
      .replace(/^Synthèse Spirituelle$/gmi, '**Synthèse Spirituelle**')
      .replace(/^Principe Herméneutique$/gmi, '**Principe Herméneutique**');

    const lines = enhanced.split('\n');
    return (
      <div className="content-formatted-inner">
        {lines.map((line, index) => {
          if (line.startsWith('**') && line.endsWith('**')) {
            return <div key={index} className="content-bold">{line.replace(/\*\*/g, '')}</div>;
          } else if (line.trim()) {
            return <div key={index} className="content-line">{line}</div>;
          } else {
            return <div key={index} className="content-space"></div>;
          }
        })}
      </div>
    );
  }

  /* ---------- UI ---------- */

  return (
    <div className="page-wrap">
      <div className="header-marquee">
        <div className="marquee-container">
          <div className="marquee-content" data-text="✨ MEDITATION BIBLIQUE ✨ ÉTUDE SPIRITUELLE ✨ SAGESSE DIVINE ✨ MÉDITATION THÉOLOGIQUE ✨ CONTEMPLATION SACRÉE ✨ RÉFLEXION INSPIRÉE ✨">
            ✨ MEDITATION BIBLIQUE ✨ ÉTUDE SPIRITUELLE ✨ SAGESSE DIVINE ✨ MÉDITATION THÉOLOGIQUE ✨ CONTEMPLATION SACRÉE ✨ RÉFLEXION INSPIRÉE ✨
          </div>
        </div>
      </div>

      <div className="topband">
        <div className="progress-bubble">{Math.round(progress)}%</div>
        <div className="progress-card">
          <div className="progress-gradient" onClick={handleGradientClick}>
            <div className="color-knob" style={{left: `${knobPosition}%`}} onMouseDown={handleKnobMouseDown}/>
          </div>
        </div>
      </div>

      <div className="controls-card">
        <div className="search-row">
          <input
            className="pill-input"
            placeholder="Rechercher (ex : Marc 5:1, 1 Jean 2, Genèse 1:1-5)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          <button className="pill-btn reset" onClick={handleReset}>🔄 Reset</button>
          <button className={`pill-btn special ${activeId === 0 ? 'active' : ''}`} onClick={handleVersetsClick}>📖 Versets</button>
          <button className="pill-btn accent" onClick={handleGenerate}>Générer</button>
        </div>
      </div>

      <div className="two-cols">
        <aside className="left-card">
          <div className="left-header">Rubriques ({RUBRIQUES.length})</div>
          <RubriquesInline
            items={RUBRIQUES}
            activeId={activeId}
            onSelect={(id)=> setActiveId(id)}
            rubriquesStatus={rubriquesStatus}
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

          <div className="welcome" style={{display: content ? 'none' : 'block'}}>
            <h1>🙏 Bienvenue dans votre Espace d'Étude</h1>
            <p>​Cet outil vous accompagne dans une méditation biblique structurée et claire.</p>
          </div>

          <div className="section">
            {content ? (
              <div className="content-formatted">{formatContent(content)}</div>
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

function SelectPill({ label, value, onChange, options }) {
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select className="pill-select" value={value} onChange={(e)=> onChange(e.target.value)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}

function NumberPill({ label, value, onChange, min=1, max=100, step=1 }) {
  const list = ["vide"]; for (let i=min; i<=max; i+=step) list.push(i);
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={(e)=> onChange(e.target.value === "vide" ? "vide" : Number(e.target.value))}
      >
        {list.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}
