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
  const [knobPosition, setKnobPosition] = React.useState(0); // Position du bouton sur la palette (0-100%)
  const [isResetting, setIsResetting] = React.useState(false); // Flag pour éviter la sauvegarde lors du reset
  const [rubriquesStatus, setRubriquesStatus] = React.useState({}); // État des LEDs de chaque rubrique
  const [lastStudyLabel, setLastStudyLabel] = React.useState("Dernière étude"); // Label du bouton dernière étude

  // Initialiser les couleurs au chargement
  React.useEffect(() => {
    updateBackgroundColor(knobPosition);
    updateLastStudyLabel(); // Charger le label au démarrage
  }, []);

  // Mettre à jour les couleurs quand knobPosition change
  React.useEffect(() => {
    updateBackgroundColor(knobPosition);
  }, [knobPosition]);

  // Mettre à jour le label de "Dernière étude"
  function updateLastStudyLabel() {
    try {
      const stored = localStorage.getItem("lastStudy");
      if (stored) {
        const data = JSON.parse(stored);
        const label = `${data.book || "Jean"} ${data.chapter || 3}`;
        setLastStudyLabel(label);
        console.log('Last study label updated to:', label);
      } else {
        setLastStudyLabel("Dernière étude");
      }
    } catch (e) {
      console.error('Error updating last study label:', e);
      setLastStudyLabel("Dernière étude");
    }
  }

  // Mettre à jour le statut des rubriques quand livre/chapitre change
  React.useEffect(() => {
    if (book !== "vide" && chapter !== "vide") {
      // Tous les rubriques sont prêts (LEDs jaunes)
      const newStatus = {};
      for (let i = 0; i < RUBRIQUES.length; i++) {
        newStatus[i] = 'ready';
      }
      setRubriquesStatus(newStatus);
    } else {
      // Reset des LEDs si pas de sélection
      setRubriquesStatus({});
    }
  }, [book, chapter]);

  var passageLabel = (book === "vide" || chapter === "vide" || verse === "vide") 
    ? "Sélectionnez un passage" 
    : book + " " + chapter + ":" + verse + " " + version;

  // Fonction pour gérer les clics sur le gradient et changer la couleur de fond
  function handleGradientClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = (x / width) * 100;
    
    // Mettre à jour la position du bouton
    setKnobPosition(Math.max(0, Math.min(100, percentage)));
    
    // Appliquer la couleur selon la position
    updateBackgroundColor(percentage);
  }

  // Fonction pour gérer le drag du bouton
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

  // Fonction pour mettre à jour la couleur de fond selon le pourcentage
  function updateBackgroundColor(percentage) {
    let newColor, gradientEnd, buttonColor, buttonColorHover, shadowColor;
    
    if (percentage < 25) {
      newColor = "#dbeafe"; // Bleu
      gradientEnd = "#bfdbfe";
      buttonColor = "#3b82f6";
      buttonColorHover = "#2563eb";
      shadowColor = "59, 130, 246"; // RGB values for rgba
    } else if (percentage < 50) {
      newColor = "#e9d5ff"; // Violet
      gradientEnd = "#ddd6fe";
      buttonColor = "#8b5cf6";
      buttonColorHover = "#7c3aed";
      shadowColor = "139, 92, 246";
    } else if (percentage < 75) {
      newColor = "#fed7aa"; // Orange
      gradientEnd = "#fdba74";
      buttonColor = "#f59e0b";
      buttonColorHover = "#d97706";
      shadowColor = "245, 158, 11";
    } else {
      newColor = "#bbf7d0"; // Vert
      gradientEnd = "#86efac";
      buttonColor = "#10b981";
      buttonColorHover = "#059669";
      shadowColor = "16, 185, 129";
    }
    
    console.log('Changing page background to:', newColor, 'at position:', percentage + '%');
    
    // Appliquer immédiatement à la page
    const pageWrap = document.querySelector('.page-wrap');
    if (pageWrap) {
      pageWrap.style.background = `linear-gradient(180deg, ${newColor} 0%, ${gradientEnd} 100%)`;
    }
    
    // Appliquer la couleur aux boutons dynamiques
    const root = document.documentElement;
    root.style.setProperty('--dynamic-button-color', buttonColor);
    root.style.setProperty('--dynamic-button-hover', buttonColorHover);
    root.style.setProperty('--dynamic-shadow-color', shadowColor);
  }

  // Fonction pour changer de livre et ajuster le chapitre si nécessaire
  function handleBookChange(newBook) {
    setBook(newBook);
    if (newBook === "vide") {
      setChapter("vide");
    } else {
      const maxChapters = BOOK_CHAPTERS[newBook] || 150;
      if (chapter === "vide" || chapter > maxChapters) {
        setChapter(1);
      }
    }
  }

  function handleValidate() {
    if (!search.trim()) {
      setProgress(function(p){ return p < 15 ? 15 : p; });
      return;
    }
    
    // Parser intelligent de la recherche
    const searchText = search.trim().toLowerCase();
    console.log('Parsing search:', searchText);
    
    // Mapping des noms de livres (minuscules vers noms corrects)
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
    let foundV
