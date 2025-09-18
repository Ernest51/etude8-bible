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

        {/* 7. Interface avec sidebar 28 rubriques et ascenseur */}
        <div className="study-app-container">
          {/* Sidebar gauche avec ascenseur */}
          <aside className="study-sidebar">
            <div className="sidebar-header">Rubriques (28)</div>
            
            <div className="sidebar-controls">
              <button 
                className="control-btn" 
                onClick={() => {
                  const wrap = document.getElementById('rubriquesWrap');
                  if (wrap) wrap.scrollBy({top: -160, behavior: 'smooth'});
                }}
                title="Monter"
              >
                ▲
              </button>
              <button 
                className="control-btn"
                onClick={() => {
                  const wrap = document.getElementById('rubriquesWrap');
                  if (wrap) wrap.scrollBy({top: 160, behavior: 'smooth'});
                }}
                title="Descendre"
              >
                ▼
              </button>
              <div className="search-container">
                <input 
                  className="filter-input"
                  placeholder="Trouver une rubrique... (ex: espérance)"
                  onChange={(e) => {
                    const q = e.target.value.trim().toLowerCase();
                    document.querySelectorAll('.study-rubrique').forEach(r => {
                      const txt = r.textContent.toLowerCase();
                      r.style.display = txt.includes(q) ? 'flex' : 'none';
                    });
                  }}
                />
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                defaultValue="0"
                className="elevator-range"
                title="Ascenseur"
                onChange={(e) => {
                  const pct = Number(e.target.value);
                  const wrap = document.getElementById('rubriquesWrap');
                  if (wrap) {
                    const maxScroll = wrap.scrollHeight - wrap.clientHeight;
                    wrap.scrollTo({top: Math.round(maxScroll * pct/100), behavior: 'auto'});
                  }
                }}
              />
            </div>

            <div className="rubriques-scroll-wrap" id="rubriquesWrap">
              {STUDY_SECTIONS.map((section, i) => (
                <div 
                  key={section.id}
                  className={`study-rubrique ${selectedSection === section.id ? 'active' : ''}`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <div className="rubrique-index">{i}</div>
                  <div className="rubrique-meta">
                    <h4>{section.title}</h4>
                    <p>Courte description de la rubrique n°{i} — cliquez pour aller à la section correspondante.</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Zone de réponses à droite */}
          <main className="study-responses">
            <div className="responses-header">
              <div className="nav-controls">
                <button 
                  className="nav-action-btn"
                  onClick={() => setSelectedSection(Math.max(0, selectedSection - 1))}
                  disabled={selectedSection === 0}
                >
                  ◂ Précédent
                </button>
                <button 
                  className="nav-action-btn"
                  onClick={() => setSelectedSection(Math.min(STUDY_SECTIONS.length - 1, selectedSection + 1))}
                  disabled={selectedSection === STUDY_SECTIONS.length - 1}
                >
                  Suivant ▸
                </button>
              </div>
              <div className="made-with">Made with ❤️ — Espace d'étude</div>
            </div>

            <section className="welcome-section">
              <h1>🙏 Bienvenue dans votre Espace d'Étude Biblique</h1>
              <p>Cet outil vous accompagne dans la méditation approfondie des Écritures avec une approche théologique rigoureuse.</p>
            </section>

            {/* Zone de réponses dynamique selon la rubrique sélectionnée */}
            <section className="response-area">
              <div className="current-study-header">
                <h2>{selectedSection}. {STUDY_SECTIONS[selectedSection]?.title}</h2>
                <span className="study-progress">{selectedSection + 1} / {STUDY_SECTIONS.length}</span>
              </div>

              <div className="study-content-detailed">
                <div className="study-description">
                  <h3>📚 Contenu d'étude</h3>
                  <p>{STUDY_SECTIONS[selectedSection]?.content || "Contenu de l'étude à venir..."}</p>
                </div>

                <div className="study-questions">
                  <h3>💡 Questions d'approfondissement</h3>
                  <div className="questions-grid">
                    <div className="question-card">
                      <h4>Question 1 : Contexte</h4>
                      <p>Quel est le contexte historique et littéraire de ce passage ?</p>
                      <textarea 
                        className="response-input" 
                        placeholder="Votre réponse ici..."
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div className="question-card">
                      <h4>Question 2 : Signification</h4>
                      <p>Quelle est la signification théologique principale de cette section ?</p>
                      <textarea 
                        className="response-input" 
                        placeholder="Votre réponse ici..."
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div className="question-card">
                      <h4>Question 3 : Application</h4>
                      <p>Comment appliquer concrètement ces enseignements dans votre vie ?</p>
                      <textarea 
                        className="response-input" 
                        placeholder="Votre réponse ici..."
                        rows="3"
                      ></textarea>
                    </div>
                    
                    <div className="question-card">
                      <h4>Question 4 : Réflexion personnelle</h4>
                      <p>Quelle est votre réflexion personnelle sur ce passage ?</p>
                      <textarea 
                        className="response-input" 
                        placeholder="Votre réponse ici..."
                        rows="3"
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="study-actions">
                  <button className="save-btn">💾 Sauvegarder les réponses</button>
                  <button className="generate-btn" onClick={handleGenerate}>🤖 Générer une méditation IA</button>
                  <button className="export-btn">📄 Exporter en PDF</button>
                </div>

                <div className="study-notes">
                  <h3>📝 Notes personnelles</h3>
                  <textarea 
                    className="notes-input"
                    placeholder="Ajoutez vos notes personnelles, références bibliques, insights spirituels..."
                    rows="4"
                  ></textarea>
                </div>
              </div>
            </section>
          </main>
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