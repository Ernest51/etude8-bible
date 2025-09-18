import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Bible Books and Chapters mapping - EXACT copy from HTML
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

// Rubriques d'étude biblique (29 sections) - Avec contenu détaillé
const STUDY_SECTIONS = [
  { 
    id: 0, 
    title: "Étude verset par verset", 
    subtitle: "Analyse détaillée de...", 
    progress: 85,
    content: "Analyse minutieuse de chaque verset dans son contexte immédiat. Examen des termes clés, de la structure grammaticale et des nuances linguistiques. Étude des relations logiques entre les versets et leur contribution au message global du passage."
  },
  { 
    id: 1, 
    title: "Prière d'ouverture", 
    subtitle: "Invocation de l'Esprit Saint...", 
    progress: 70,
    content: "Moment de recueillement pour demander l'illumination divine. Invocation de l'Esprit Saint pour comprendre la Parole de Dieu. Préparation du cœur et de l'esprit à recevoir l'enseignement biblique avec humilité et foi."
  },
  { 
    id: 2, 
    title: "Structure littéraire", 
    subtitle: "Analyse de l'architecture...", 
    progress: 60,
    content: "Identification de la structure narrative ou poétique du passage. Analyse des parallélismes, chiasmes et autres figures rhétoriques. Compréhension de l'organisation logique du texte et de sa progression thématique."
  },
  { 
    id: 3, 
    title: "Questions du chapitre précédent", 
    subtitle: "Synthèse", 
    progress: 45,
    content: "Révision des points clés étudiés précédemment. Connexions avec les thèmes développés dans les chapitres antérieurs. Synthèse progressive pour maintenir la cohérence de l'étude biblique globale."
  },
  { 
    id: 4, 
    title: "Thème doctrinal", 
    subtitle: "Enseignements centraux...", 
    progress: 30,
    content: "Identification des vérités doctrinales principales du passage. Articulation avec les grands thèmes théologiques de l'Écriture. Mise en lumière des enseignements fondamentaux sur Dieu, le salut, la vie chrétienne."
  },
  { 
    id: 5, 
    title: "Fondements théologiques", 
    subtitle: "Bases scripturaires...", 
    progress: 25,
    content: "Exploration des fondements bibliques des doctrines présentées. Liens avec l'ensemble de la révélation divine. Ancrage dans la tradition théologique orthodoxe et les confessions de foi historiques."
  },
  { 
    id: 6, 
    title: "Références croisées", 
    subtitle: "Liens avec autres passages...", 
    progress: 20,
    content: "Identification des passages parallèles dans l'Écriture. Comparaison avec d'autres textes bibliques sur le même thème. Enrichissement de la compréhension par l'analogie de la foi et l'unité scripturaire."
  },
  { 
    id: 7, 
    title: "Application personnelle", 
    subtitle: "Mise en pratique...", 
    progress: 15,
    content: "Translation des vérités bibliques dans la vie quotidienne. Questions de réflexion personnelle et d'examen de conscience. Propositions concrètes pour vivre selon les enseignements étudiés."
  },
  { 
    id: 8, 
    title: "Fruits spirituels", 
    subtitle: "Croissance et transformation...", 
    progress: 10,
    content: "Identification des fruits spirituels attendus de cette étude. Croissance dans la foi, l'espérance et la charité. Transformation progressive à l'image du Christ par la méditation de sa Parole."
  },
  { 
    id: 9, 
    title: "Mots-clés théologiques", 
    subtitle: "Termes importants...", 
    progress: 8,
    content: "Analyse des termes théologiques centraux du passage. Étude étymologique et sémantique des mots-clés. Compréhension approfondie du vocabulaire biblique et de ses implications doctrinales."
  },
  { 
    id: 10, 
    title: "Symboles et métaphores", 
    subtitle: "Langage figuré...", 
    progress: 7,
    content: "Interprétation des images, symboles et métaphores utilisés. Compréhension du langage figuré dans son contexte culturel. Signification spirituelle des éléments symboliques du texte biblique."
  },
  { 
    id: 11, 
    title: "Parallèles canoniques", 
    subtitle: "Échos bibliques...", 
    progress: 6,
    content: "Recherche d'échos et de parallèles dans l'ensemble du canon biblique. Harmonie entre l'Ancien et le Nouveau Testament. Unité thématique et progressive de la révélation divine."
  },
  { 
    id: 12, 
    title: "Contexte historique", 
    subtitle: "Arrière-plan culturel...", 
    progress: 5,
    content: "Situation historique et culturelle du passage étudié. Contexte politique, social et religieux de l'époque. Éclairage des circonstances qui ont donné naissance au texte biblique."
  },
  { 
    id: 13, 
    title: "Genre littéraire", 
    subtitle: "Style et forme...", 
    progress: 4,
    content: "Identification du genre littéraire (narratif, poétique, prophétique, épistolaire...). Caractéristiques stylistiques spécifiques au genre. Méthodes d'interprétation appropriées selon le type de littérature."
  },
  { 
    id: 14, 
    title: "Progression narrative", 
    subtitle: "Développement du récit...", 
    progress: 3,
    content: "Analyse de la progression du récit ou de l'argumentation. Étapes logiques du développement thématique. Dynamique narrative et construction rhétorique du passage."
  },
  { 
    id: 15, 
    title: "Personnages clés", 
    subtitle: "Acteurs principaux...", 
    progress: 2,
    content: "Étude des personnages principaux et de leur rôle. Caractérisation biblique et développement psychologique. Leçons spirituelles tirées des figures bibliques présentées."
  },
  { 
    id: 16, 
    title: "Géographie biblique", 
    subtitle: "Lieux et régions...", 
    progress: 1,
    content: "Localisation géographique des événements relatés. Significance théologique des lieux mentionnés. Impact de la géographie sur la compréhension du message biblique."
  },
  { 
    id: 17, 
    title: "Chronologie", 
    subtitle: "Repères temporels...", 
    progress: 1,
    content: "Datation et séquencement des événements bibliques. Insertion dans l'histoire du salut. Perspective chronologique et développement progressif de la révélation."
  },
  { 
    id: 18, 
    title: "Langue originale", 
    subtitle: "Hébreu et grec...", 
    progress: 1,
    content: "Examen du texte dans les langues originales (hébreu, araméen, grec). Nuances linguistiques perdues dans la traduction. Richesse sémantique des termes originaux."
  },
  { 
    id: 19, 
    title: "Traditions manuscrites", 
    subtitle: "Variantes textuelles...", 
    progress: 1,
    content: "Étude des variantes dans les manuscrits anciens. Critique textuelle et établissement du texte original. Fiabilité de la transmission du texte biblique."
  },
  { 
    id: 20, 
    title: "Commentaires patristiques", 
    subtitle: "Pères de l'Église...", 
    progress: 1,
    content: "Interprétations des Pères de l'Église et des commentateurs anciens. Tradition exégétique et herméneutique historique. Sagesse des premiers commentateurs chrétiens."
  },
  { 
    id: 21, 
    title: "Exégèse moderne", 
    subtitle: "Approches contemporaines...", 
    progress: 1,
    content: "Contributions de l'exégèse scientifique moderne. Méthodes historico-critiques et leurs apports. Dialogue entre tradition et recherche contemporaine."
  },
  { 
    id: 22, 
    title: "Implications pastorales", 
    subtitle: "Application en Église...", 
    progress: 1,
    content: "Applications pratiques pour la vie ecclésiale. Enseignements pour le ministère pastoral. Guide pour l'accompagnement spirituel et l'édification communautaire."
  },
  { 
    id: 23, 
    title: "Dimension prophétique", 
    subtitle: "Aspects eschatologiques...", 
    progress: 1,
    content: "Éléments prophétiques et eschatologiques du passage. Perspective d'accomplissement dans l'histoire du salut. Espérance chrétienne et perspective éternelle."
  },
  { 
    id: 24, 
    title: "Typologie christologique", 
    subtitle: "Préfigurations du Christ...", 
    progress: 1,
    content: "Figures et préfigurations du Christ dans l'Ancien Testament. Accomplissement néotestamentaire des types vétérotestamentaires. Centralité du Christ dans toute l'Écriture."
  },
  { 
    id: 25, 
    title: "Dimension sacramentelle", 
    subtitle: "Mystères de la foi...", 
    progress: 1,
    content: "Liens avec les sacrements et la liturgie. Dimension mystique et sacramentelle de la Parole. Nourriture spirituelle et communion avec le divin."
  },
  { 
    id: 26, 
    title: "Spiritualité contemplative", 
    subtitle: "Méditation profonde...", 
    progress: 1,
    content: "Approche contemplative et méditative du texte. Lectio divina et rumination spirituelle. Intériorisation et assimilation personnelle de la Parole de Dieu."
  },
  { 
    id: 27, 
    title: "Mission et témoignage", 
    subtitle: "Partage de la foi...", 
    progress: 1,
    content: "Implications missionnaires du passage étudié. Appel à l'évangélisation et au témoignage. Partage de la foi et annonce de la Bonne Nouvelle."
  },
  { 
    id: 28, 
    title: "Synthèse finale", 
    subtitle: "Récapitulatif et conclusion...", 
    progress: 1,
    content: "Synthèse de tous les éléments étudiés. Vision d'ensemble et message central du passage. Conclusion spirituelle et engagement personnel renouvelé."
  }
];

function App() {
  // États React pour remplacer le DOM vanilla JS
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
  const [selectedSection, setSelectedSection] = useState(0);

  // Refs pour le slider
  const barRef = useRef(null);
  const knobRef = useRef(null);

  // Utility functions - EXACT copy from HTML
  const buildRef = () => {
    const s = searchValue.trim();
    if (s) return s;
    return `${selectedBook} ${selectedChapter}:${selectedVerse}`;
  };

  // Slider functionality - EXACT copy from HTML converted to React
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

  // Initialize slider - EXACT copy from HTML
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

  // Initialize dropdowns - EXACT copy from HTML
  useEffect(() => {
    setSelectedBook("Jean");
    setSelectedChapter("3");
    setSelectedVerse("16");
  }, []);

  // Event handlers - EXACT copy from HTML
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
    const ref = buildRef();
    window.alert(`Passage validé : ${ref}`);
  };

  const handleRead = () => {
    const ref = buildRef();
    window.open(`https://www.bible.com/fr/bible/93/${encodeURIComponent(ref.replace(/\s+/g,""))}.LSG`, "_blank");
  };

  const handleGenerate = async () => {
    const ref = buildRef();
    const API_BASE = BACKEND_URL || "";
    const url = `${API_BASE}/api/generate-study?ref=${encodeURIComponent(ref)}`;
    
    setResTitle(`Requête : ${ref}`);
    setResMeta("Appel en cours…");
    setResBody("");
    setResultVisible(true);

    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();

      if (!data.ok) { 
        throw new Error(data.error || "Réponse invalide"); 
      }

      setResMeta(`BibleId: ${data.bibleId || "?"}`);
      const text = data?.passage?.text || "(pas de texte)";
      const secs = (data.sections||[]).slice(0,5).map(s=>`• ${s.title}`).join("\n");
      setResBody(`${text}\n\nSections (aperçu)\n${secs || "—"}`);
    } catch (e) {
      setResMeta("Échec de l'appel API.");
      setResBody(e.message);
    }
  };

  const handleChat = () => window.alert("Bouton ChatGPT (placeholder)");
  const handleLast = () => window.alert("Dernière étude (placeholder)");

  return (
    <div className="app-layout">
      {/* Sidebar gauche avec les rubriques */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Rubriques (29)</h2>
        </div>
        <div className="sidebar-content">
          {STUDY_SECTIONS.map((section) => (
            <div 
              key={section.id} 
              className={`study-item ${selectedSection === section.id ? 'active' : ''}`}
              onClick={() => setSelectedSection(section.id)}
            >
              <div className="study-badge">{section.id}</div>
              <div className="study-info">
                <h4>{section.title}</h4>
                <p>{section.subtitle}</p>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${section.progress}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="main-content">
        <div className="container">
          <div className="progress-badge">
            <span id="pct">{Math.round(pct)}%</span>
          </div>
          <div className="title">Méditation</div>

          <div className="crumbs">
            <span>Accueil</span>
            <span className="sep">→</span>
            <span>Méditation</span>
            <span className="sep">→</span>
          </div>

          <div className="steps">
            <div className="step active">
              <div className="dot">1</div>
              <div>Passage</div>
            </div>
            <div className="step">
              <div className="dot">2</div>
              <div>Génération</div>
            </div>
            <div className="step">
              <div className="dot">3</div>
              <div>Méditation</div>
            </div>
          </div>

          <div className="card palette">
            <div className="bar-wrap" id="bar" ref={barRef}>
              <div className="knob" id="knob" ref={knobRef} aria-label="Intensité"></div>
            </div>
            <div className="dot-row" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>

          <div className="toolbar">
            <input 
              className="search" 
              id="search" 
              type="text" 
              placeholder="Rechercher (ex : Marc 5:1, 1 Jean 2, Genèse 1:1–5)" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <div className="filters">
              <select className="select" id="book" value={selectedBook} onChange={handleBookChange}>
                {Object.keys(BOOKS_CHAPTERS).map(book => (
                  <option key={book} value={book}>{book}</option>
                ))}
              </select>
              <select className="select" id="chapter" value={selectedChapter} onChange={(e) => setSelectedChapter(e.target.value)}>
                {Array.from({length: BOOKS_CHAPTERS[selectedBook] || 1}, (_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
              <select className="select" id="verse" value={selectedVerse} onChange={(e) => setSelectedVerse(e.target.value)}>
                {Array.from({length: 50}, (_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
              <select className="select short" id="version" value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}>
                <option>LSG</option>
                <option>NBS</option>
                <option>NEG</option>
              </select>
              <select className="select short" id="length" value={selectedLength} onChange={(e) => setSelectedLength(e.target.value)}>
                <option>300</option>
                <option selected={selectedLength === "500"}>500</option>
                <option>800</option>
              </select>

              <button className="btn btn-outline" id="btnChat" onClick={handleChat}>ChatGPT</button>
              <button className="btn btn-soft" id="btnLast" onClick={handleLast}>Dernière étude</button>
              <button className="btn btn-ghost" id="btnReset" onClick={handleReset}>Reset</button>
              <button className="btn btn-primary" id="btnValidate" onClick={handleValidate}>Valider</button>
              <button className="btn btn-ghost" id="btnRead" onClick={handleRead}>Lire la Bible</button>
              <button className="btn btn-warn" id="btnGen" onClick={handleGenerate}>Générer</button>
            </div>
          </div>

          {/* GRILLE 2 COLONNES */}
          <div className="grid">
            <div className="card section">
              <h3>Rubriques (29)</h3>
              <p style={{color:"#5a7381", margin:0}}>Cliquez sur une rubrique dans la sidebar pour afficher son contenu détaillé ci-dessous</p>
            </div>

            <div className="card section">
              <h3>{selectedSection}. {STUDY_SECTIONS[selectedSection]?.title || "Étude verset par verset"}</h3>
              <div className="footer-controls">
                <span className="pill">◀ Précédent</span>
                <span className="pill">Made with Emergent</span>
              </div>
            </div>
          </div>

          {/* CONTENU DES 29 RUBRIQUES - EN DESSOUS DE LA GRILLE */}
          <div style={{width: "100%", marginTop: "32px"}}>
            <div className="card section">
              <h2 style={{color: "#0ea5b3", marginBottom: "20px"}}>
                📚 Étude détaillée : {STUDY_SECTIONS[selectedSection]?.title}
              </h2>
              
              <p style={{lineHeight: "1.7", color: "#0f2d3a", fontSize: "16px", marginBottom: "24px"}}>
                {STUDY_SECTIONS[selectedSection]?.content || "Contenu de l'étude à venir..."}
              </p>
              
              <div style={{background: "rgba(14, 165, 179, 0.05)", border: "1px solid rgba(14, 165, 179, 0.15)", borderRadius: "16px", padding: "20px", marginTop: "20px"}}>
                <h4 style={{color: "#0ea5b3", margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600"}}>
                  💡 Questions de réflexion
                </h4>
                <ul style={{margin: "0", paddingLeft: "24px", color: "#5a7381", lineHeight: "1.6"}}>
                  <li style={{marginBottom: "8px"}}>Comment ce passage s'applique-t-il à ma vie personnelle ?</li>
                  <li style={{marginBottom: "8px"}}>Quel enseignement principal puis-je retenir ?</li>
                  <li style={{marginBottom: "8px"}}>Comment puis-je mettre en pratique cette vérité biblique ?</li>
                  <li>Quelle prière puis-je formuler à partir de cette méditation ?</li>
                </ul>
              </div>

              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingTop: "20px", borderTop: "2px solid rgba(14, 165, 179, 0.1)"}}>
                <button 
                  className="btn btn-outline"
                  onClick={() => setSelectedSection(Math.max(0, selectedSection - 1))}
                  disabled={selectedSection === 0}
                  style={{opacity: selectedSection === 0 ? 0.5 : 1}}
                >
                  ◀ Précédente
                </button>
                
                <span style={{color: "#0ea5b3", fontSize: "18px", fontWeight: "700"}}>
                  {selectedSection + 1} / 29
                </span>
                
                <button 
                  className="btn btn-outline"
                  onClick={() => setSelectedSection(Math.min(28, selectedSection + 1))}
                  disabled={selectedSection === 28}
                  style={{opacity: selectedSection === 28 ? 0.5 : 1}}
                >
                  Suivante ▶
                </button>
              </div>
            </div>
          </div>

          {resultVisible && (
            <div id="result" className="card section" style={{display: "block", marginTop: "16px"}}>
              <h3>Résultat</h3>
              <h4 id="res-title">{resTitle}</h4>
              <div className="small" id="res-meta">{resMeta}</div>
              <div id="res-body" style={{whiteSpace: "pre-wrap"}} dangerouslySetInnerHTML={{__html: resBody.replace(/\n/g, '<br>')}}></div>
            </div>
          )}

          <div className="space-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default App;