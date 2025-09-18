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

// Rubriques d'étude biblique (28 sections comme dans l'HTML)
const STUDY_SECTIONS = [
  { id: 0, title: "Étude verset par verset", content: "Analyse minutieuse de chaque verset dans son contexte immédiat. Examen des termes clés, de la structure grammaticale et des nuances linguistiques." },
  { id: 1, title: "Prière d'ouverture", content: "Moment de recueillement pour demander l'illumination divine. Invocation de l'Esprit Saint pour comprendre la Parole de Dieu." },
  { id: 2, title: "Structure littéraire", content: "Identification de la structure narrative ou poétique du passage. Analyse des parallélismes, chiasmes et autres figures rhétoriques." },
  { id: 3, title: "Questions du chapitre précédent", content: "Révision des points clés étudiés précédemment. Connexions avec les thèmes développés dans les chapitres antérieurs." },
  { id: 4, title: "Contexte historique et géographique", content: "Situation historique et géographique du passage étudié. Contexte politique, social et religieux de l'époque." },
  { id: 5, title: "Genre littéraire & style", content: "Identification du genre littéraire et analyse stylistique. Caractéristiques spécifiques au type de littérature biblique." },
  { id: 6, title: "Thèmes théologiques majeurs", content: "Exploration des grands thèmes théologiques présents dans le passage. Doctrine et enseignements centraux." },
  { id: 7, title: "Personnages et rôles", content: "Étude des personnages principaux et de leur rôle dans le récit. Caractérisation biblique et développement." },
  { id: 8, title: "Mot-clé et lexique", content: "Analyse des termes clés et du vocabulaire spécialisé. Étude étymologique et sémantique des mots importants." },
  { id: 9, title: "Analyse syntaxique", content: "Examen de la structure grammaticale et syntaxique du texte original. Relations logiques entre les propositions." },
  { id: 10, title: "Originalité du texte", content: "Étude de l'originalité et de la spécificité du passage. Éléments distinctifs et contributions uniques." },
  { id: 11, title: "Parallèles bibliques", content: "Identification des passages parallèles dans l'Écriture. Comparaison avec d'autres textes bibliques similaires." },
  { id: 12, title: "Applications pratiques", content: "Translation des vérités bibliques dans la vie quotidienne. Mise en pratique concrète des enseignements." },
  { id: 13, title: "Points de doctrine", content: "Enseignements doctrinaux spécifiques du passage. Implications pour la foi et la pratique chrétiennes." },
  { id: 14, title: "Perspectives patristiques", content: "Interprétations des Pères de l'Église et des commentateurs anciens. Tradition exégétique historique." },
  { id: 15, title: "Réception dans l'église", content: "Histoire de la réception et de l'interprétation du passage dans la tradition ecclésiale." },
  { id: 16, title: "Problèmes herméneutiques", content: "Questions d'interprétation complexes et débats herméneutiques. Approches méthodologiques." },
  { id: 17, title: "Comparaison intertestamentaire", content: "Relations entre l'Ancien et le Nouveau Testament. Typologie et accomplissement prophétique." },
  { id: 18, title: "Éléments christologiques", content: "Aspects christologiques du passage. Préfigurations et révélations concernant le Christ." },
  { id: 19, title: "Saint-Esprit & pneumatologie", content: "Dimension pneumatologique du texte. Rôle et action du Saint-Esprit dans le passage." },
  { id: 20, title: "Éthique et comportement", content: "Implications éthiques et morales du passage. Principes de conduite pour la vie chrétienne." },
  { id: 21, title: "Responsabilité du croyant", content: "Devoirs et responsabilités du croyant selon les enseignements du passage." },
  { id: 22, title: "Communauté de foi", content: "Dimension communautaire et ecclésiale du passage. Vie en communauté chrétienne." },
  { id: 23, title: "Espérance eschatologique", content: "Perspective eschatologique et espérance future révélée dans le passage." },
  { id: 24, title: "Sagesse pratique", content: "Enseignements de sagesse pratique pour la vie quotidienne. Principes de vie sage." },
  { id: 25, title: "Combat spirituel", content: "Aspects du combat spirituel présents dans le passage. Lutte contre les forces du mal." },
  { id: 26, title: "Mystères & sacrements", content: "Dimension mystique et sacramentelle du passage. Liens avec les sacrements chrétiens." },
  { id: 27, title: "Conclusion & prière de clôture", content: "Synthèse finale de l'étude et prière de conclusion. Récapitulatif des enseignements principaux." }
];

function App() {
  const [selectedSection, setSelectedSection] = useState(0);
  const [pct, setPct] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [selectedBook, setSelectedBook] = useState("Jean");
  const [selectedChapter, setSelectedChapter] = useState("3");
  const [selectedVerse, setSelectedVerse] = useState("16");
  const [selectedVersion, setSelectedVersion] = useState("LSG");
  const [selectedLength, setSelectedLength] = useState("500");

  // Refs pour le slider
  const barRef = useRef(null);
  const knobRef = useRef(null);

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

  // Event handlers
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
  };

  const handleValidate = () => {
    const ref = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
    window.alert(`Passage validé : ${ref}`);
  };

  const handleRead = () => {
    const ref = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
    window.open(`https://www.bible.com/fr/bible/93/${encodeURIComponent(ref.replace(/\s+/g,""))}.LSG`, "_blank");
  };

  const handleGenerate = async () => {
    const ref = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
    window.alert(`Génération d'étude pour : ${ref}`);
  };

  const handleChat = () => window.alert("Bouton ChatGPT (placeholder)");
  const handleLast = () => window.alert("Dernière étude (placeholder)");

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
    </div>
  );
}

export default App;