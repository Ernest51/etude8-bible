import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Bible Books and Chapters mapping
const BOOKS_CHAPTERS = {
  "Genèse":50,"Exode":40,"Lévitique":27,"Nombres":36,"Deutéronome":34,
  "Josué":24,"Juges":21,"Ruth":4,"1 Samuel":31,"2 Samuel":24,
  "1 Rois":22,"2 Rois":25,"1 Chroniques":29,"2 Chroniques":36,
  "Esdras":10,"Néhémie":13,"Esther":10,"Job":42,"Psaumes":150,
  "Proverbes":31,"Ecclésiaste":12,"Cantique":8,"Ésaïe":66,"Jérémie":52,
  "Lamentations":5,"Ézéchiel":48,"Daniel":12,"Osée":14,"Joël":3,
  "Amos":9,"Abdias":1,"Jonas":4,"Michée":7,"Nahum":3,
  "Habacuc":3,"Sophonie":3,"Aggée":2,"Zacharie":14,"Malachie":4,
  "Matthieu":28,"Marc":16,"Luc":24,"Jean":21,"Actes":28,
  "Romains":16,"1 Corinthiens":16,"2 Corinthiens":13,"Galates":6,
  "Éphésiens":6,"Philippiens":4,"Colossiens":4,"1 Thessaloniciens":5,
  "2 Thessaloniciens":3,"1 Timothée":6,"2 Timothée":4,"Tite":3,
  "Philémon":1,"Hébreux":13,"Jacques":5,"1 Pierre":5,"2 Pierre":3,
  "1 Jean":5,"2 Jean":1,"3 Jean":1,"Jude":1,"Apocalypse":22
};

// Rubriques d'étude biblique (29 sections du nouveau code)
const RUBRIQUES = [
  { id: 0, title: "Étude verset par verset", subtitle: "Analyse détaillée" },
  { id: 1, title: "Prière d'ouverture", subtitle: "Invocation de l'Esprit" },
  { id: 2, title: "Structure littéraire", subtitle: "Architecture du passage" },
  { id: 3, title: "Questions du chapitre précédent", subtitle: "Synthèse" },
  { id: 4, title: "Thème doctrinal", subtitle: "Enseignements clés" },
  { id: 5, title: "Fondements théologiques", subtitle: "Bases scripturaires" },
  { id: 6, title: "Contexte historique", subtitle: "Cadre et auteur" },
  { id: 7, title: "Contexte culturel", subtitle: "Us et coutumes" },
  { id: 8, title: "Contexte géographique", subtitle: "Lieux et cartes" },
  { id: 9, title: "Analyse lexicale", subtitle: "Mots clés (hébreu/grec)" },
  { id: 10, title: "Parallèles bibliques", subtitle: "Passages associés" },
  { id: 11, title: "Prophétie et accomplissement", subtitle: "Lien canonique" },
  { id: 12, title: "Personnages", subtitle: "Rôles et motivations" },
  { id: 13, title: "Structure rhétorique", subtitle: "Arguments et logique" },
  { id: 14, title: "Théologie trinitaire", subtitle: "Père / Fils / Esprit" },
  { id: 15, title: "Christ au centre", subtitle: "Christologie du texte" },
  { id: 16, title: "Évangile et grâce", subtitle: "Bonne nouvelle ici" },
  { id: 17, title: "Application personnelle", subtitle: "Vie pratique" },
  { id: 18, title: "Application communautaire", subtitle: "Église / famille" },
  { id: 19, title: "Prière de réponse", subtitle: "Adoration et supplication" },
  { id: 20, title: "Questions d'étude", subtitle: "Pour groupe ou perso" },
  { id: 21, title: "Points de vigilance", subtitle: "Mésusages à éviter" },
  { id: 22, title: "Objections et réponses", subtitle: "Apologétique succincte" },
  { id: 23, title: "Perspective missionnelle", subtitle: "Témoignage et service" },
  { id: 24, title: "Éthique chrétienne", subtitle: "Choix et vertus" },
  { id: 25, title: "Louange / liturgie", subtitle: "Usage cultuel" },
  { id: 26, title: "Méditation guidée", subtitle: "Silence et contemplation" },
  { id: 27, title: "Mémoire / versets clés", subtitle: "À retenir par cœur" },
  { id: 28, title: "Plan d'action", subtitle: "Pas concrets pour la semaine" },
];

const BOOKS_FR = [
  "Genèse","Exode","Lévitique","Nombres","Deutéronome",
  "Josué","Juges","Ruth","1 Samuel","2 Samuel","1 Rois","2 Rois",
  "1 Chroniques","2 Chroniques","Esdras","Néhémie","Esther","Job",
  "Psaumes","Proverbes","Ecclésiaste","Cantique des Cantiques","Ésaïe",
  "Jérémie","Lamentations","Ézéchiel","Daniel","Osée","Joël","Amos",
  "Abdias","Jonas","Michée","Nahum","Habacuc","Sophonie","Aggée",
  "Zacharie","Malachie","Matthieu","Marc","Luc","Jean","Actes",
  "Romains","1 Corinthiens","2 Corinthiens","Galates","Éphésiens",
  "Philippiens","Colossiens","1 Thessaloniciens","2 Thessaloniciens",
  "1 Timothée","2 Timothée","Tite","Philémon","Hébreux","Jacques",
  "1 Pierre","2 Pierre","1 Jean","2 Jean","3 Jean","Jude","Apocalypse",
];

// Max bornes raisonnables (couvre toute la Bible)
const MAX_CHAPTERS = 150; // Psaumes
const MAX_VERSES = 176;   // Psaume 119

function App() {
  const [selectedSection, setSelectedSection] = useState(0);
  const [pct, setPct] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [selectedBook, setSelectedBook] = useState("Jean");
  const [selectedChapter, setSelectedChapter] = useState("3");
  const [selectedVerse, setSelectedVerse] = useState("16");
  const [selectedVersion, setSelectedVersion] = useState("LSG");
  const [selectedLength, setSelectedLength] = useState("500");

  // Nouveaux états pour le code de méditation
  const [activeRubriqueId, setActiveRubriqueId] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | generating | done | error
  const [output, setOutput] = useState("");
  const [progress, setProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [useChatGPT, setUseChatGPT] = useState(true);

  // Refs pour le slider
  const barRef = useRef(null);
  const knobRef = useRef(null);

  // Charger la dernière étude si présente
  useEffect(() => {
    const last = localStorage.getItem("lastStudy");
    if (last) {
      try {
        const parsed = JSON.parse(last);
        setSelectedBook(parsed.book);
        setSelectedChapter(parsed.chapter.toString());
        setSelectedVerse(parsed.verse.toString());
        setSelectedVersion(parsed.version);
        setSelectedLength((parsed.tokens ?? 500).toString());
      } catch {}
    }
  }, []);

  const passageLabel = `${selectedBook} ${selectedChapter}:${selectedVerse} ${selectedVersion}`;

  // Slider functionality
  const setPctFunc = (p) => {
    const newPct = Math.max(0, Math.min(100, p));
    setPct(newPct);
    
    if (barRef.current && knobRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      const pad = 10;
      const x = pad + (newPct/100)*(rect.width - 2*pad);
      knobRef.current.style.left = `${x}px`;
    }
  };

  const clientX = (e) => {
    if (e.touches && e.touches[0]) return e.touches[0].clientX;
    return e.clientX;
  };

  const onMove = (e) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = Math.max(rect.left, Math.min(clientX(e), rect.right));
    const rel = (x - rect.left) / rect.width;
    setPctFunc(rel * 100);
  };

  // Initialize slider
  useEffect(() => {
    let dragging = false;

    const handleMouseDown = () => { dragging = true; };
    const handleMouseUp = () => { dragging = false; };
    const handleMouseMove = (e) => { if (dragging) onMove(e); };
    const handleTouchStart = () => { dragging = true; };
    const handleTouchEnd = () => { dragging = false; };
    const handleTouchMove = (e) => { if (dragging) onMove(e); };

    const knob = knobRef.current;
    const bar = barRef.current;

    if (knob && bar) {
      knob.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);
      knob.addEventListener("touchstart", handleTouchStart, {passive: true});
      window.addEventListener("touchend", handleTouchEnd, {passive: true});
      window.addEventListener("touchmove", handleTouchMove, {passive: false});
      bar.addEventListener("click", onMove);
      
      // Initialize
      setPctFunc(0);
    }

    return () => {
      if (knob && bar) {
        knob.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("mousemove", handleMouseMove);
        knob.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener("touchmove", handleTouchMove);
        bar.removeEventListener("click", onMove);
      }
    };
  }, []);

  const handleBookChange = (e) => {
    const book = e.target.value;
    setSelectedBook(book);
    setSelectedChapter("1");
    setSelectedVerse("1");
  };

  const handleReset = () => {
    setSearchValue("");
    setSelectedBook("Jean");
    setSelectedChapter("3");
    setSelectedVerse("16");
    setSelectedVersion("LSG");
    setSelectedLength("500");
    setPctFunc(0);
    setActiveRubriqueId(0);
    setOutput("");
    setStatus("idle");
    setProgress(0);
    setSearch("");
  };

  const handleValidate = () => {
    const ref = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
    toast(`Passage validé: ${ref}`);
  };

  const handleRead = () => {
    const url = youVersionUrl(selectedBook, parseInt(selectedChapter), parseInt(selectedVerse), selectedVersion);
    window.open(url, "_blank");
  };

  const handleGenerate = async () => {
    setStatus("generating");
    setOutput("");
    setProgress(5);

    // Sauvegarder le contexte courant
    handleSaveLast();

    try {
      const res = await fetch(`${BACKEND_URL}/api/generate-study`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage: `${selectedBook} ${selectedChapter}:${selectedVerse}`,
          version: selectedVersion,
          tokens: parseInt(selectedLength),
          model: useChatGPT ? "gpt" : "local",
          requestedRubriques: RUBRIQUES.map(r => r.id),
        }),
      });

      if (res.ok) {
        setProgress(60);
        const data = await res.json().catch(() => null);
        if (data?.content) {
          setOutput(data.content);
          setProgress(100);
          setStatus("done");
          return;
        }
      }
    } catch (e) {
      console.warn("API non disponible, simulation fallback");
    }

    // SIMULATION (fallback si l'API n'est pas disponible)
    await simulateGeneration({ passageLabel, setProgress, setOutput });
    setStatus("done");
  };

  const handleChat = () => window.alert("Bouton ChatGPT (placeholder)");
  const handleLast = () => {
    const last = localStorage.getItem("lastStudy");
    if (last) {
      try {
        const parsed = JSON.parse(last);
        setSelectedBook(parsed.book);
        setSelectedChapter(parsed.chapter.toString());
        setSelectedVerse(parsed.verse.toString());
        setSelectedVersion(parsed.version);
        setSelectedLength((parsed.tokens ?? 500).toString());
        toast("Dernière étude chargée");
      } catch {
        toast("Aucune étude précédente trouvée");
      }
    } else {
      toast("Aucune étude précédente trouvée");
    }
  };

  const handleSaveLast = () => {
    const payload = { 
      book: selectedBook, 
      chapter: parseInt(selectedChapter), 
      verse: parseInt(selectedVerse), 
      version: selectedVersion, 
      tokens: parseInt(selectedLength) 
    };
    localStorage.setItem("lastStudy", JSON.stringify(payload));
    toast("Dernière étude enregistrée");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    // Exemples acceptés: "Marc 5:1", "Jn 3:16", "Psaume 23:1"
    const m = search.match(/^(.*)\s+(\d+):(\d+)$/i);
    if (m) {
      const b = normalizeBook(m[1]);
      setSelectedBook(b);
      setSelectedChapter(m[2]);
      setSelectedVerse(m[3]);
      toast(`Passage défini: ${b} ${m[2]}:${m[3]}`);
    } else {
      toast("Format attendu: Livre chap:verset (ex: Marc 5:1)");
    }
  };

  return (
    <div className="complete-extracted-app">
      {/* 1. Badge "0%" en haut à gauche et élément rond en haut à droite */}
      <div className="top-badges">
        <div className="progress-circle-badge">
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="round-toggle-element">
          ⚙️
        </div>
      </div>

      {/* Main container */}
      <div className="main-app-container">
        {/* 2. Titre "Méditation" */}
        <div className="meditation-title-section">
          <h1>Méditation</h1>
        </div>

        {/* 3. Breadcrumbs "Accueil → Méditation →" */}
        <div className="breadcrumbs-navigation">
          <span>Accueil</span>
          <span className="arrow">→</span>
          <span>Méditation</span>
          <span className="arrow">→</span>
        </div>

        {/* 4. Étapes "1 Passage", "2 Génération", "3 Méditation" */}
        <div className="meditation-steps">
          <div className="step-item active">
            <div className="step-circle">1</div>
            <div className="step-text">Passage</div>
          </div>
          <div className="step-item">
            <div className="step-circle">2</div>
            <div className="step-text">Génération</div>
          </div>
          <div className="step-item">
            <div className="step-circle">3</div>
            <div className="step-text">Méditation</div>
          </div>
        </div>

        {/* 5. LA PALETTE DE COULEURS ARC-EN-CIEL avec slider */}
        <div className="rainbow-palette-container">
          <div className="rainbow-slider-bar" ref={barRef}>
            <div className="rainbow-slider-knob" ref={knobRef}></div>
          </div>
          <div className="rainbow-color-dots">
            <span className="color-dot" style={{background: '#0284c7'}}></span>
            <span className="color-dot" style={{background: '#3b82f6'}}></span>
            <span className="color-dot" style={{background: '#8b5cf6'}}></span>
            <span className="color-dot" style={{background: '#d946ef'}}></span>
            <span className="color-dot" style={{background: '#f43f5e'}}></span>
            <span className="color-dot" style={{background: '#f97316'}}></span>
            <span className="color-dot" style={{background: '#f59e0b'}}></span>
            <span className="color-dot" style={{background: '#84cc16'}}></span>
            <span className="color-dot" style={{background: '#22c55e'}}></span>
            <span className="color-dot" style={{background: '#10b981'}}></span>
          </div>
        </div>

        {/* Contrôles du passage */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <Select label="Livre" value={selectedBook} onChange={setSelectedBook} options={Object.keys(BOOKS_CHAPTERS)} />
          <NumberSelect label="Chapitre" value={parseInt(selectedChapter)} onChange={(val) => setSelectedChapter(val.toString())} min={1} max={BOOKS_CHAPTERS[selectedBook] || 150} />
          <NumberSelect label="Verset" value={parseInt(selectedVerse)} onChange={(val) => setSelectedVerse(val.toString())} min={1} max={176} />
          <Select label="Version" value={selectedVersion} onChange={setSelectedVersion} options={["LSG","BDS","NEG79"]} />
          <NumberSelect label="Tokens" value={parseInt(selectedLength)} onChange={(val) => setSelectedLength(val.toString())} min={128} max={2048} step={64} />
          <Toggle label="ChatGPT" enabled={useChatGPT} setEnabled={setUseChatGPT} />
        </div>

        {/* Barre d'actions */}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="ghost" onClick={handleLast}>Dernière étude</Button>
          <Button variant="ghost" onClick={handleReset}>Reset</Button>
          <Button onClick={handleValidate}>Valider</Button>
          <Button variant="secondary" onClick={handleRead}>Lire la Bible</Button>
          <Button variant="primary" onClick={handleGenerate} disabled={status === "generating"}>
            {status === "generating" ? "Génération…" : "Générer"}
          </Button>
        </div>

        {/* Recherche rapide */}
        <form onSubmit={handleSearchSubmit} className="mt-6">
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Rechercher (ex : Marc 5:1)"
            className="w-full md:w-1/2 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </form>

        {/* Rubriques (29) */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Rubriques ({RUBRIQUES.length})</h2>
          <p className="text-sm text-gray-500">Cliquez sur une rubrique dans la liste pour afficher son contenu détaillé ci-dessous</p>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Colonne gauche scrollable */}
            <aside className="lg:col-span-4 lg:sticky lg:top-36 xl:top-40">
              <div className="rounded-2xl border bg-white/60 p-2">
                <div
                  className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-2 overscroll-contain"
                  style={{ scrollbarGutter: "stable both-edges" }}
                  aria-label="Liste des rubriques"
                >
                  <ul className="flex flex-col gap-2">
                    {RUBRIQUES.map((r, idx) => (
                      <li key={r.id}>
                        <button
                          onClick={() => setActiveRubriqueId(r.id)}
                          className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                            activeRubriqueId === r.id
                              ? "border-emerald-400 bg-emerald-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs">
                              {idx}
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{r.title}</div>
                              <div className="text-xs text-gray-500 truncate">{r.subtitle}</div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            {/* Zone de contenu à droite */}
            <div className="lg:col-span-8">
              <div className="rounded-2xl border p-4 bg-white/60 min-h-[300px]">
                <h3 className="text-lg font-semibold mb-2">
                  {RUBRIQUES.find((r) => r.id === activeRubriqueId)?.title}
                </h3>
                <div className="prose max-w-none">
                  {status === "done" && output ? (
                    <Article content={output} />
                  ) : (
                    <p className="text-gray-600">
                      Sélectionnez une rubrique et cliquez sur <strong>Générer</strong> pour voir le contenu
                      de l'étude pour <em>{passageLabel}</em>.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 9. Logo "Made with Emergent" */}
      <div className="emergent-logo">
        Made with Emergent
      </div>

      <ToastContainer />
    </div>
  );
}

/* -------------------- Composants UI légers (pas de dépendances externes) -------------------- */

function Step({ n, label, active }) {
  return (
    <li className={`inline-flex items-center gap-2 ${active ? "text-emerald-700" : "text-gray-400"}`}>
      <span className={`h-6 w-6 rounded-full border inline-flex items-center justify-center text-xs ${active ? "border-emerald-500" : "border-gray-300"}`}>{n}</span>
      <span className="font-medium">{label}</span>
    </li>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

function NumberSelect({ label, value, onChange, min=1, max=100, step=1 }) {
  const opts = [];
  for (let i=min; i<=max; i+=step) opts.push(i);
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e)=>onChange(Number(e.target.value))}
        className="rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        {opts.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, enabled, setEnabled }) {
  return (
    <div className="flex items-end gap-3">
      <label className="text-sm text-gray-600">{label}</label>
      <button
        type="button"
        onClick={()=>setEnabled(!enabled)}
        className={`relative inline-flex h-9 w-16 items-center rounded-full border transition ${enabled ? "bg-emerald-500" : "bg-gray-200"}`}
        aria-pressed={enabled}
      >
        <span className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition ${enabled ? "translate-x-8" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function Button({ children, variant = "default", ...props }) {
  const base = "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none";
  const variants = {
    default: "border bg-white hover:bg-gray-50",
    ghost: "border bg-transparent hover:bg-gray-50",
    secondary: "border bg-blue-50 hover:bg-blue-100",
    primary: "border bg-emerald-500 text-white hover:bg-emerald-600",
  };
  return (
    <button className={`${base} ${variants[variant]}`} {...props}>{children}</button>
  );
}

function Badge({ children, color = "gray" }) {
  const map = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${map[color]}`}>{children}</span>
  );
}

function Article({ content }) {
  // Accepte du texte markdown-like simple ou plain-text
  return (
    <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
  );
}

/* -------------------- Utilitaires -------------------- */

function normalizeBook(raw) {
  const s = raw.trim().toLowerCase();
  // Normalisations rapides (exemples usuels)
  const map = {
    "jn": "Jean", "jean": "Jean", "joh": "Jean", "john": "Jean",
    "mt": "Matthieu", "mat": "Matthieu", "matt": "Matthieu",
    "mc": "Marc", "marc": "Marc", "mark": "Marc",
    "lc": "Luc", "luc": "Luc", "luke": "Luc",
    "ps": "Psaumes", "psaume": "Psaumes", "psaumes": "Psaumes",
  };
  for (const k of Object.keys(map)) {
    if (s === k) return map[k];
  }
  // Première lettre en majuscules par défaut
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function youVersionUrl(book, chapter, verse, version = "LSG") {
  // Par défaut, on pointe vers la LSG (93). Construire un code livre robuste
  // dépasserait le cadre; on tombe sur une URL de recherche propre si le code est inconnu.
  const base = "https://www.bible.com/fr/search/bible";
  const q = encodeURIComponent(`${book} ${chapter}:${verse} ${version}`);
  return `${base}?query=${q}`;
}

async function simulateGeneration({ passageLabel, setProgress, setOutput }) {
  // Simule une génération progressive en 3 étapes
  setProgress(25);
  await wait(600);
  setProgress(60);
  await wait(600);
  setProgress(90);
  await wait(400);

  const demo = `Titre: Méditation sur ${passageLabel}\n\n1) Vérités clés\n- Dieu aime le monde d'un amour actif.\n- Le salut est un don, non un mérite.\n\n2) Commentaire\nDans ce verset, l'accent est mis sur l'initiative divine: Dieu "a tant aimé". La foi reçoit, elle ne produit pas. La vie éternelle commence dès maintenant par la communion avec le Fils.\n\n3) Prière\nSeigneur, apprends-moi à vivre aujourd'hui en réponse à ton amour, confiant dans ta grâce. Amen.`;
  setOutput(demo);
  setProgress(100);
}

function wait(ms) { return new Promise(res => setTimeout(res, ms)); }

/* -------------------- Mini système de toast (sans lib externe) -------------------- */

const toastQueue = [];
let toastId = 0;

function toast(message) {
  const id = ++toastId;
  toastQueue.push({ id, message });
  const evt = new CustomEvent("__toast_push");
  window.dispatchEvent(evt);
  setTimeout(() => {
    const idx = toastQueue.findIndex(t => t.id === id);
    if (idx >= 0) toastQueue.splice(idx, 1);
    window.dispatchEvent(new CustomEvent("__toast_push"));
  }, 2400);
}

function ToastContainer() {
  const [, force] = useState(0);
  const forceUpdate = () => force(x => x + 1);
  
  useEffect(() => {
    const onPush = () => forceUpdate();
    window.addEventListener("__toast_push", onPush);
    return () => window.removeEventListener("__toast_push", onPush);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 mx-auto flex max-w-md flex-col gap-2">
      {toastQueue.map((t) => (
        <div key={t.id} className="pointer-events-auto rounded-xl border bg-white px-4 py-2 shadow">
          <div className="text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  );
}

export default App;