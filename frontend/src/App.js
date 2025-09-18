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

  // Initialiser les couleurs au chargement
  React.useEffect(() => {
    updateBackgroundColor(knobPosition);
  }, []);

  // Mettre à jour les couleurs quand knobPosition change
  React.useEffect(() => {
    updateBackgroundColor(knobPosition);
  }, [knobPosition]);

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
    let foundVerse = "vide";
    
    // Pattern 1: "livre chapitre:verset" (ex: "marc 2:3")
    const pattern1 = searchText.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (pattern1) {
      const bookName = pattern1[1].trim();
      foundBook = bookMapping[bookName];
      if (foundBook) {
        foundChapter = parseInt(pattern1[2]);
        foundVerse = parseInt(pattern1[3]);
      }
    }
    
    // Pattern 2: "livre chapitre" (ex: "marc 2") 
    if (!foundBook) {
      const pattern2 = searchText.match(/^(.+?)\s+(\d+)$/);
      if (pattern2) {
        const bookName = pattern2[1].trim();
        foundBook = bookMapping[bookName];
        if (foundBook) {
          foundChapter = parseInt(pattern2[2]);
          foundVerse = "vide";
        }
      }
    }
    
    // Pattern 3: juste le livre (ex: "luc")
    if (!foundBook) {
      const bookName = searchText.trim();
      foundBook = bookMapping[bookName];
      if (foundBook) {
        foundChapter = 1;
        foundVerse = 1;
      }
    }
    
    // Appliquer les résultats si un livre a été trouvé
    if (foundBook) {
      console.log(`Found: ${foundBook} ${foundChapter}:${foundVerse}`);
      
      setBook(foundBook);
      setChapter(foundChapter);
      setVerse(foundVerse);
      
      // Vider la recherche après parsing réussi
      setSearch("");
      
      // Feedback visuel
      setProgress(50);
      setTimeout(() => setProgress(0), 1000);
      
      console.log(`Search parsed successfully: ${foundBook} ${foundChapter}:${foundVerse}`);
    } else {
      // Livre non trouvé
      console.log('Book not found in search');
      setProgress(function(p){ return p < 15 ? 15 : p; });
    }
  }

  function handleReset() {
    // Marquer qu'on est en train de faire un reset
    setIsResetting(true);
    
    // Remettre tous les paramètres à vide/défaut
    setBook("vide");      // Vide au lieu de Genèse
    setChapter("vide");   // Vide au lieu de 1
    setVerse("vide");     // Vide au lieu de 1
    setVersion("LSG");    // Première version
    setLength(500);       // Première longueur
    setChatgpt(true); 
    setProgress(0);       // Progress à 0%
    setSearch("");        // Recherche vide
    setActiveId(0);       // Première rubrique (Étude verset par verset)
    setContent("");       // Contenu vide
    setKnobPosition(0);   // Palette de couleur au début
    setRubriquesStatus({}); // Reset des LEDs
    
    // Remettre le fond à la couleur par défaut (bleu)
    updateBackgroundColor(0);
    
    // Note: localStorage "lastStudy" est préservé et ne sera pas modifié par cette action
    console.log('Reset effectué - Tout vidé, Dernière étude inchangée');
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

  // Récupérer la dernière étude pour l'affichage
  function getLastStudyLabel() {
    try {
      const stored = localStorage.getItem("lastStudy");
      if (stored) {
        const data = JSON.parse(stored);
        return `${data.book || "Jean"} ${data.chapter || 3}`;
      }
    } catch (e) {}
    return "Dernière étude";
  }

  function handleReadBible() {
    var q = encodeURIComponent(passageLabel);
    window.open("https://www.bible.com/fr/search/bible?query=" + q, "_blank");
  }

  async function handleGenerate() {
    // Vérifier que tous les champs requis sont remplis
    if (book === "vide" || chapter === "vide" || verse === "vide") {
      setContent("⚠️ Veuillez d'abord sélectionner un livre, un chapitre et un verset pour générer une étude biblique.");
      setProgress(0);
      return;
    }
    
    setProgress(5); await wait(200);
    setProgress(25); await wait(250);
    
    try {
      console.log('Making API call with payload:', {
        passage: passageLabel,
        version: version,
        tokens: length,
        model: chatgpt ? "gpt" : "claude",
        requestedRubriques: [activeId]
      });
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      // Check if we're doing verse-by-verse study (rubrique 0 = "Étude verset par verset")
      const isVerseByVerse = activeId === 0;
      const endpoint = isVerseByVerse ? '/api/generate-verse-by-verse' : '/api/generate-study';
      
      const payload = isVerseByVerse ? {
        passage: passageLabel,
        version: version
      } : {
        passage: passageLabel,
        version: version,
        tokens: length,
        model: chatgpt ? "gpt" : "claude",
        requestedRubriques: [activeId]
      };
      
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear timeout if request completes
      setProgress(60); await wait(350);
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data received:', !!data.content);
        setProgress(100);
        setContent(data.content || "Méditation générée avec succès");
        
        // Sauvegarder automatiquement la dernière étude (sauf si c'est un reset)
        if (!isResetting) {
          try {
            localStorage.setItem("lastStudy", JSON.stringify({
              book: book, chapter: chapter, verse: verse, version: version, length: length, chatgpt: chatgpt
            }));
          } catch (e) {}
        } else {
          // Reset terminé, on peut sauvegarder les prochaines études
          setIsResetting(false);
        }
      } else {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Full error:', error);
      setProgress(100);
      if (error.name === 'AbortError') {
        setContent(
          "🙏 Méditation sur " + passageLabel +
          "\n\n- Dieu aime, Dieu donne, la foi reçoit." +
          "\n- La vie éternelle commence déjà par la communion avec le Fils." +
          "\n\nPrière : Seigneur, apprends-moi à répondre à ton amour aujourd'hui. Amen." +
          "\n\n[Note: Délai d'attente dépassé - utilisation du contenu de fallback]"
        );
      } else {
        setContent(
          "🙏 Méditation sur " + passageLabel +
          "\n\n- Dieu aime, Dieu donne, la foi reçoit." +
          "\n- La vie éternelle commence déjà par la communion avec le Fils." +
          "\n\nPrière : Seigneur, apprends-moi à répondre à ton amour aujourd'hui. Amen." +
          "\n\n[Note: Contenu de fallback - Erreur: " + error.message + "]"
        );
      }
    }
  }

  function goPrev() { setActiveId(function(i){ return Math.max(0, i - 1); }); }
  function goNext() { setActiveId(function(i){ return Math.min(RUBRIQUES.length - 1, i + 1); }); }

  async function handleVersetsClick() {
    setActiveId(0);
    console.log('Versets button clicked - activeId set to 0');
    
    // TOUJOURS forcer Genèse 1:1 pour l'étude verset par verset
    console.log('Setting Genèse 1:1 for verse by verse generation');
    setBook("Genèse");
    setChapter(1);
    setVerse(1);
    
    // Petit délai pour que les états se mettent à jour
    await wait(1000);
    
    // Générer automatiquement l'étude verset par verset
    await generateVerseByVerse();
  }

  async function generateVerseByVerse() {
    setProgress(5); await wait(200);
    setProgress(25); await wait(250);
    
    try {
      // Utiliser les valeurs forcées : Genèse 1:1 LSG
      const passageForApi = "Genèse 1:1 LSG";
      
      console.log('Generating verse by verse for:', passageForApi);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      // Utiliser l'URL relative au lieu de localhost
      const response = await fetch('/api/generate-verse-by-verse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passage: passageForApi,
          version: "LSG"
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setProgress(60); await wait(350);
      
      if (response.ok) {
        const data = await response.json();
        setProgress(100);
        setContent(data.content || "Étude verset par verset générée avec succès");
        
        // Marquer la rubrique 0 comme complétée (LED verte)
        setRubriquesStatus(prev => ({
          ...prev,
          0: 'completed'
        }));
        
        console.log('Verse by verse generation successful');
      } else {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error('Verse by verse generation error:', error);
      setProgress(100);
      
      // Contenu de fallback détaillé pour Genèse 1
      setContent(`# 📖 Étude Verset par Verset - Genèse Chapitre 1

## 🎯 Introduction au Chapitre

Cette étude examine chaque verset de **Genèse 1** selon les principes de l'**exégèse grammatico-historique** et de l'**herméneutique orthodoxe**.

---

## 📝 Verset 1

### **Texte Biblique :**
*"Au commencement, Dieu créa les cieux et la terre."*

### **💡 Explication Théologique :**

**"Au commencement"** (*Bereshit*) ouvre la révélation divine par l'affirmation de l'origine absolue. Le terme hébraïque implique un commencement temporel de l'univers matériel.

**"Dieu"** (*Elohim*) - forme plurielle indiquant la majesté divine et suggérant la Trinité. Ce pluriel d'excellence révèle la plénitude de la divinité engagée dans l'acte créateur.

**"Créa"** (*bara*) - verbe exclusivement divin signifiant création ex nihilo. Contrairement à *yatsar* (façonner) ou *asah* (faire), *bara* indique une création absolue, du néant vers l'existence.

---

## 📝 Verset 2

### **Texte Biblique :**
*"La terre était informe et vide : il y avait des ténèbres à la surface de l'abîme, et l'esprit de Dieu se mouvait au-dessus des eaux."*

### **💡 Explication Théologique :**

**"Informe et vide"** (*tohu wa-bohu*) décrit l'état initial de la matière créée. Les ténèbres précèdent la lumière dans l'ordre créateur.

**"L'Esprit de Dieu se mouvait"** (*ruach Elohim merachephet*) - le Saint-Esprit couvait comme un oiseau sur son nid, préparant l'éclosion de la création ordonnée.

---

## 🙏 Synthèse Spirituelle

Cette étude verset par verset révèle la cohérence parfaite de la **Parole de Dieu**. Chaque verset s'harmonise dans l'**analogie de la foi**.

---
**Soli Deo Gloria** - *Étude conforme à la sainte doctrine*

[Note: Erreur API - ${error.message}]`);
      
      // Marquer quand même comme complété avec contenu de fallback
      setRubriquesStatus(prev => ({
        ...prev,
        0: 'completed'
      }));
    }
  }

  return (
    <div className="page-wrap">
      {/* HEADER avec Marquee MEDITATION */}
      <div className="header-marquee">
        <div className="marquee-container">
          <div className="marquee-content" data-text="✨ MEDITATION BIBLIQUE ✨ ÉTUDE SPIRITUELLE ✨ SAGESSE DIVINE ✨ MÉDITATION THÉOLOGIQUE ✨ CONTEMPLATION SACRÉE ✨ RÉFLEXION INSPIRÉE ✨">
            ✨ MEDITATION BIBLIQUE ✨ ÉTUDE SPIRITUELLE ✨ SAGESSE DIVINE ✨ MÉDITATION THÉOLOGIQUE ✨ CONTEMPLATION SACRÉE ✨ RÉFLEXION INSPIRÉE ✨
          </div>
        </div>
      </div>

      {/* Bandeau haut (bulle %, barre gradient, points) */}
      <div className="topband">
        <div className="progress-bubble">{Math.round(progress)}%</div>
        <div className="progress-card">
          <div className="progress-gradient" onClick={handleGradientClick}>
            <div 
              className="color-knob"
              style={{left: `${knobPosition}%`}}
              onMouseDown={handleKnobMouseDown}
            />
          </div>
        </div>
      </div>

      {/* Bloc contrôles */}
      <div className="controls-card">
        <div className="search-row">
          <input
            className="pill-input"
            placeholder="Rechercher (ex : Marc 5:1, 1 Jean 2, Genèse 1:1-5)"
            value={search}
            onChange={function(e){ setSearch(e.target.value); }}
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
          <button className="pill-btn" onClick={function(){ window.open('https://chatgpt.com/', '_blank'); }}>ChatGPT</button>
          <button className="pill-btn" onClick={handleLastStudy}>{getLastStudyLabel()}</button>
          <button className="pill-btn reset" onClick={handleReset}>🔄 Reset</button>
          <button 
            className={`pill-btn special ${activeId === 0 ? 'active' : ''}`} 
            onClick={handleVersetsClick}
          >
            📖 Versets
          </button>
          <button className="pill-btn accent" onClick={handleGenerate}>Générer</button>
        </div>
      </div>

      {/* 2 colonnes */}
      <div className="two-cols">
        <aside className="left-card">
          <div className="left-header">Rubriques ({RUBRIQUES.length})</div>
          <RubriquesInline
            items={RUBRIQUES}
            activeId={activeId}
            onSelect={function(id){ setActiveId(id); }}
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
              <pre className="content-pre">{content}</pre>
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
  var label = props.label, value = props.value, onChange = props.onChange, options = props.options;
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={function(e){ onChange(e.target.value); }}
      >
        {options.map(function(opt){ return <option key={opt} value={opt}>{opt}</option>; })}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}

function NumberPill(props) {
  var label = props.label, value = props.value, onChange = props.onChange,
      min = props.min || 1, max = props.max || 100, step = props.step || 1;
  
  var list = ["vide"]; // Ajouter "vide" en premier
  for (var i=min; i<=max; i+=step) list.push(i);
  
  return (
    <div className="pill">
      <span className="pill-label">{label}</span>
      <select
        className="pill-select"
        value={value}
        onChange={function(e){ 
          const val = e.target.value;
          // Convertir en nombre si ce n'est pas "vide"
          onChange(val === "vide" ? "vide" : Number(val)); 
        }}
      >
        {list.map(function(n){ return <option key={n} value={n}>{n}</option>; })}
      </select>
      <span className="chev">▾</span>
    </div>
  );
}