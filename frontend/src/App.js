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

        {/* 6. Barre de recherche et boutons/dropdowns */}
        <div className="search-controls-section">
          <div className="search-input-row">
            <input 
              className="search-field" 
              type="text" 
              placeholder="Rechercher (ex : Marc 5:1, 1 Jean 2, Genèse 1:1-5)" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button className="validate-btn" onClick={handleValidate}>Valider</button>
            <button className="read-bible-btn" onClick={handleRead}>Lire la Bible</button>
          </div>
          
          <div className="dropdowns-buttons-row">
            <select className="form-dropdown" value={selectedBook} onChange={handleBookChange}>
              <option>Livre</option>
              {Object.keys(BOOKS_CHAPTERS).map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
            <select className="form-dropdown" value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)}>
              <option>Chapitre</option>
              {Array.from({length: BOOKS_CHAPTERS[selectedBook] || 1}, (_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
            <select className="form-dropdown" value={selectedVerse} onChange={(e) => setSelectedVerse(e.target.value)}>
              <option>Verset</option>
              {Array.from({length: 50}, (_, i) => (
                <option key={i+1} value={i+1}>{i+1}</option>
              ))}
            </select>
            <select className="form-dropdown" value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}>
              <option>LSG</option>
              <option>NBS</option>
              <option>NEG</option>
            </select>
            <select className="form-dropdown" value={selectedLength} onChange={(e) => setSelectedLength(e.target.value)}>
              <option>500</option>
              <option>300</option>
              <option>800</option>
            </select>
            <button className="form-btn" onClick={handleChat}>ChatGPT</button>
            <button className="form-btn" onClick={handleLast}>Dernière étude</button>
            <button className="form-btn" onClick={handleReset}>Reset</button>
            <button className="generate-btn" onClick={handleGenerate}>Générer</button>
          </div>
        </div>

        {/* 7. Section avec 3 colonnes : Rubriques + Navigation + Contenu détaillé */}
        <div className="three-column-container">
          {/* Colonne 1 : Section Rubriques (29) à gauche */}
          <div className="rubriques-left-panel">
            <h2 className="rubriques-header">Rubriques (29)</h2>
            
            <div className="rubriques-cards-container">
              {STUDY_SECTIONS.slice(0, 3).map((section) => (
                <div 
                  key={section.id}
                  className={`rubrique-study-card ${selectedSection === section.id ? 'active' : ''}`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <div className="study-card-number">{section.id}</div>
                  <div className="study-card-info">
                    <h4 className="study-card-title">{section.title}</h4>
                    <p className="study-card-subtitle">{section.subtitle}</p>
                  </div>
                  <div className="study-card-orange-icon"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Colonne 2 : Section "0. Étude verset par verset" au centre */}
          <div className="current-study-center-panel">
            <h2 className="current-study-header">
              {selectedSection}. {STUDY_SECTIONS[selectedSection]?.title || "Étude verset par verset"}
            </h2>
            <div className="study-panel-navigation">
              <button 
                className="study-nav-prev"
                onClick={() => setSelectedSection(Math.max(0, selectedSection - 1))}
                disabled={selectedSection === 0}
              >
                ◄ Précédent
              </button>
              <button 
                className="study-nav-next"
                onClick={() => setSelectedSection(Math.min(4, selectedSection + 1))}
                disabled={selectedSection === 4}
              >
                Suivant ►
              </button>
            </div>
          </div>

          {/* Colonne 3 : Section Bienvenue CENTRÉE dominante */}
          <div className="right-content-panel">
            {/* Section Bienvenue PRINCIPALE - Centrée et dominante */}
            <div className="welcome-bible-main-section">
              <h1 className="welcome-bible-main-title">
                🙏 Bienvenue dans votre Espace d'Étude Biblique
              </h1>
              <p className="welcome-bible-main-text">
                Cet outil vous accompagne dans la méditation approfondie des<br />
                Écritures avec une approche théologique rigoureuse.
              </p>
              
              {/* Contenu d'étude intégré sous le titre principal */}
              {selectedSection !== null && (
                <div className="integrated-study-content">
                  <h3 className="integrated-study-title">
                    📚 {STUDY_SECTIONS[selectedSection]?.title}
                  </h3>
                  
                  <p className="integrated-study-text">
                    {STUDY_SECTIONS[selectedSection]?.content || "Contenu de l'étude à venir..."}
                  </p>
                  
                  <div className="integrated-reflection-section">
                    <h4>💡 Questions de réflexion</h4>
                    <ul>
                      <li>Comment ce passage s'applique-t-il à ma vie personnelle ?</li>
                      <li>Quel enseignement principal puis-je retenir ?</li>
                      <li>Comment puis-je mettre en pratique cette vérité biblique ?</li>
                      <li>Quelle prière puis-je formuler à partir de cette méditation ?</li>
                    </ul>
                  </div>

                  <div className="integrated-navigation">
                    <button 
                      className="integrated-nav-btn"
                      onClick={() => setSelectedSection(Math.max(0, selectedSection - 1))}
                      disabled={selectedSection === 0}
                    >
                      ◄ Précédente
                    </button>
                    
                    <span className="integrated-progress">
                      {selectedSection + 1} / 29
                    </span>
                    
                    <button 
                      className="integrated-nav-btn"
                      onClick={() => setSelectedSection(Math.min(4, selectedSection + 1))}
                      disabled={selectedSection === 4}
                    >
                      Suivante ►
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 9. Logo "Made with Emergent" */}
      <div className="emergent-logo">
        Made with Emergent
      </div>
    </div>
  );
}

export default App;