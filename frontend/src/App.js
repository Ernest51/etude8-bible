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

  return (
    <div className="new-layout">
      {/* Header avec Rubriques et Navigation */}
      <div className="header-section">
        {/* Sidebar gauche avec rubriques */}
        <div className="rubriques-sidebar">
          <h2 className="rubriques-title">Rubriques (29)</h2>
          <div className="rubriques-list">
            {STUDY_SECTIONS.slice(0, 4).map((section) => (
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
              onClick={() => setSelectedSection(Math.min(28, selectedSection + 1))}
              disabled={selectedSection === 28}
            >
              Suivant ▶
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="main-welcome">
        <div className="welcome-section">
          <h1 className="welcome-title">🙏 Bienvenue dans votre Espace d'Étude Biblique</h1>
          <p className="welcome-subtitle">
            Cet outil vous accompagne dans la méditation approfondie des<br />
            Écritures avec une approche théologique rigoureuse.
          </p>
        </div>

        {/* Cards de fonctionnalités */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>29 Rubriques Théologiques</h3>
            <p>Chaque section explore un aspect spécifique de votre passage biblique</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3>Liens YouVersion Automatiques</h3>
            <p>Toutes les références bibliques deviennent des liens cliquables</p>
          </div>
        </div>

        {/* Section contenu détaillé - s'affiche quand on clique sur une rubrique */}
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
                onClick={() => setSelectedSection(Math.min(28, selectedSection + 1))}
                disabled={selectedSection === 28}
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