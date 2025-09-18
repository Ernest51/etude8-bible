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

// Rubriques d'étude biblique (29 sections)
const STUDY_SECTIONS = [
  { 
    id: 0, 
    title: "Étude verset par verset", 
    subtitle: "Analyse détaillée de...", 
    progress: 85,
    content: "Analyse minutieuse de chaque verset dans son contexte immédiat. Examen des termes clés, de la structure grammaticale et des nuances linguistiques."
  },
  { 
    id: 1, 
    title: "Prière d'ouverture", 
    subtitle: "Invocation de l'Esprit Saint...", 
    progress: 70,
    content: "Moment de recueillement pour demander l'illumination divine. Invocation de l'Esprit Saint pour comprendre la Parole de Dieu."
  },
  { 
    id: 2, 
    title: "Structure littéraire", 
    subtitle: "Analyse de l'architecture...", 
    progress: 60,
    content: "Identification de la structure narrative ou poétique du passage. Analyse des parallélismes, chiasmes et autres figures rhétoriques."
  },
  { 
    id: 3, 
    title: "Questions du chapitre précédent", 
    subtitle: "Synthèse", 
    progress: 45,
    content: "Révision des points clés étudiés précédemment. Connexions avec les thèmes développés dans les chapitres antérieurs."
  },
  { 
    id: 4, 
    title: "Thème doctrinal", 
    subtitle: "Enseignements centraux...", 
    progress: 30,
    content: "Identification des vérités doctrinales principales du passage. Articulation avec les grands thèmes théologiques de l'Écriture."
  }
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
  const [resultVisible, setResultVisible] = useState(false);
  const [resTitle, setResTitle] = useState("");
  const [resMeta, setResMeta] = useState("");
  const [resBody, setResBody] = useState("");

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
    setResultVisible(false);
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
    <div className="complete-app">
      {/* Top Section - Badge et Sun */}
      <div className="top-header">
        <div className="progress-badge">
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="sun-toggle">
          ☀️
        </div>
      </div>

      {/* Main Container */}
      <div className="main-container">
        {/* Title */}
        <div className="title-section">
          <h1>Méditation</h1>
        </div>

        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span>Accueil</span>
          <span className="sep">→</span>
          <span>Méditation</span>
          <span className="sep">→</span>
        </div>

        {/* Steps */}
        <div className="steps-section">
          <div className="step active">
            <div className="step-dot">1</div>
            <div className="step-label">Passage</div>
          </div>
          <div className="step">
            <div className="step-dot">2</div>
            <div className="step-label">Génération</div>
          </div>
          <div className="step">
            <div className="step-dot">3</div>
            <div className="step-label">Méditation</div>
          </div>
        </div>

        {/* Rainbow Slider */}
        <div className="slider-container">
          <div className="rainbow-bar" ref={barRef}>
            <div className="slider-knob" ref={knobRef} aria-label="Intensité"></div>
          </div>
          <div className="slider-dots">
            <span></span><span></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="controls-section">
          <div className="search-row">
            <input 
              className="search-input" 
              type="text" 
              placeholder="Rechercher (ex : Marc 5:1, 1 Jean 2, Genèse 1:1-5)" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button className="btn-primary" onClick={handleValidate}>Valider</button>
            <button className="btn-secondary" onClick={handleRead}>Lire la Bible</button>
          </div>
          
          <div className="dropdown-row">
            <select className="dropdown" value={selectedBook} onChange={handleBookChange}>
              <option>Livre</option>
              {Object.keys(BOOKS_CHAPTERS).map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
            <select className="dropdown" value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)}>
              <option>Chapitre</option>
              {Array.from({length: BOOKS_CHAPTERS[selectedBook] || 1}, (_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
            <select className="dropdown" value={selectedVerse} onChange={(e) => setSelectedVerse(e.target.value)}>
              <option>Verset</option>
              {Array.from({length: 50}, (_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
            <select className="dropdown" value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}>
              <option>LSG</option>
              <option>NBS</option>
              <option>NEG</option>
            </select>
            <select className="dropdown" value={selectedLength} onChange={(e) => setSelectedLength(e.target.value)}>
              <option>500</option>
              <option>300</option>
              <option>800</option>
            </select>
            <button className="btn-light" onClick={handleChat}>ChatGPT</button>
            <button className="btn-light" onClick={handleLast}>Dernière étude</button>
            <button className="btn-light" onClick={handleReset}>Reset</button>
            <button className="btn-generate" onClick={handleGenerate}>Générer</button>
          </div>
        </div>

        {/* Rubriques Section */}
        <div className="rubriques-section">
          {/* Sidebar gauche avec rubriques */}
          <div className="rubriques-sidebar">
            <h2 className="rubriques-title">Rubriques (29)</h2>
            <div className="rubriques-list">
              {STUDY_SECTIONS.map((section) => (
                <div 
                  key={section.id}
                  className={`rubrique-item ${selectedSection === section.id ? 'active' : ''}`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <div className="rubrique-number">{section.id}</div>
                  <div className="rubrique-content">
                    <h4>{section.title}</h4>
                    <p>{section.subtitle}</p>
                  </div>
                  <div className="rubrique-icon">📖</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section droite avec titre et navigation */}
          <div className="current-section">
            <h2>{selectedSection}. {STUDY_SECTIONS[selectedSection]?.title || "Étude verset par verset"}</h2>
            <div className="navigation-buttons">
              <button 
                className="nav-btn prev"
                onClick={() => setSelectedSection(Math.max(0, selectedSection - 1))}
                disabled={selectedSection === 0}
              >
                ◀ Précédent
              </button>
              <button 
                className="nav-btn next"
                onClick={() => setSelectedSection(Math.min(4, selectedSection + 1))}
                disabled={selectedSection === 4}
              >
                Suivant ▶
              </button>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="welcome-title">🙏 Bienvenue dans votre Espace d'Étude Biblique</h1>
          <p className="welcome-subtitle">
            Cet outil vous accompagne dans la méditation approfondie des<br />
            Écritures avec une approche théologique rigoureuse.
          </p>
        </div>

        {/* Content détaillé */}
        {selectedSection !== null && (
          <div className="detailed-content">
            <h2>📚 Étude détaillée : {STUDY_SECTIONS[selectedSection]?.title}</h2>
            
            <p className="content-text">
              {STUDY_SECTIONS[selectedSection]?.content || "Contenu de l'étude à venir..."}
            </p>
            
            <div className="reflection-section">
              <h4>💡 Questions de réflexion</h4>
              <ul>
                <li>Comment ce passage s'applique-t-il à ma vie personnelle ?</li>
                <li>Quel enseignement principal puis-je retenir ?</li>
                <li>Comment puis-je mettre en pratique cette vérité biblique ?</li>
                <li>Quelle prière puis-je formuler à partir de cette méditation ?</li>
              </ul>
            </div>

            <div className="study-navigation">
              <button 
                className="study-nav-btn"
                onClick={() => setSelectedSection(Math.max(0, selectedSection - 1))}
                disabled={selectedSection === 0}
              >
                ◀ Précédente
              </button>
              
              <span className="study-progress">
                {selectedSection + 1} / 29
              </span>
              
              <button 
                className="study-nav-btn"
                onClick={() => setSelectedSection(Math.min(4, selectedSection + 1))}
                disabled={selectedSection === 4}
              >
                Suivante ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;