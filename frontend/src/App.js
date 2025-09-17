import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Progress } from './components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Separator } from './components/ui/separator';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { Loader2, Book, Search, Sun, Moon, Home, BookOpen } from 'lucide-react';

// Backend URL from environment
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Bible books data
const bibleBooks = [
  'Genèse', 'Exode', 'Lévitique', 'Nombres', 'Deutéronome', 'Josué', 'Juges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Rois', '2 Rois', '1 Chroniques', '2 Chroniques', 'Esdras', 'Néhémie',
  'Esther', 'Job', 'Psaumes', 'Proverbes', 'Ecclésiaste', 'Cantique', 'Ésaïe', 'Jérémi',
  'Lamentations', 'Ézéchiel', 'Daniel', 'Osée', 'Joël', 'Amos', 'Abdias', 'Jonas',
  'Michée', 'Nahum', 'Habacuc', 'Sophonie', 'Aggée', 'Zacharie', 'Malachie',
  'Matthieu', 'Marc', 'Luc', 'Jean', 'Actes', 'Romains', '1 Corinthiens', '2 Corinthiens',
  'Galates', 'Ephésiens', 'Philippiens', 'Colossiens', '1 Thessaloniciens', '2 Thessaloniciens',
  '1 Timothée', '2 Timothée', 'Tite', 'Philémon', 'Hébreux', 'Jacques', '1 Pierre', '2 Pierre',
  '1 Jean', '2 Jean', '3 Jean', 'Jude', 'Apocalypse'
];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedVerse, setSelectedVerse] = useState('');
  const [passage, setPassage] = useState('');
  const [density, setDensity] = useState('500');
  const [model, setModel] = useState('ChatGPT');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [studyData, setStudyData] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [error, setError] = useState('');

  // Section titles (29 sections)
  const sectionTitles = [
    "Étude verset par verset",
    "Prière d'ouverture", 
    "Structure littéraire",
    "Thème doctrinal principal",
    "Contexte historique",
    "Contexte culturel",
    "Genre littéraire",
    "Analyse linguistique",
    "Références croisées",
    "Typologie christologique",
    "Application personnelle",
    "Christ dans le passage",
    "Enseignement moral",
    "Promesses divines",
    "Avertissements",
    "Caractère de Dieu révélé",
    "Nature humaine exposée",
    "Plan de salut",
    "Sanctification",
    "Eschatologie",
    "Ecclésiologie",
    "Missionnaire",
    "Adoration et louange",
    "Intercession",
    "Méditation contemplative",
    "Mémorisation",
    "Questions de réflexion",
    "Ressources complémentaires",
    "Prière de conclusion"
  ];

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Update passage when book/chapter/verse changes
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      let newPassage = `${selectedBook} ${selectedChapter}`;
      if (selectedVerse) {
        newPassage += `:${selectedVerse}`;
      }
      setPassage(newPassage);
    }
  }, [selectedBook, selectedChapter, selectedVerse]);

  // Generate chapters options (1-50)
  const getChapterOptions = () => {
    return Array.from({ length: 50 }, (_, i) => i + 1);
  };

  // Generate verses options (1-50)
  const getVerseOptions = () => {
    return Array.from({ length: 50 }, (_, i) => i + 1);
  };

  // Generate Bible study
  const generateStudy = async () => {
    if (!passage.trim()) {
      setError('Veuillez saisir un passage biblique');
      return;
    }

    setIsGenerating(true);
    setError('');
    setProgress(0);
    setStudyData(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 500);

    try {
      console.log('🔄 Generating study for:', passage);
      console.log('🌐 API URL:', `${API}/generate-study`);
      
      const response = await axios.post(`${API}/generate-study`, {
        passage: passage.trim(),
        density: density,
        model: model
      }, {
        timeout: 120000 // 2 minutes timeout
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.data && response.data.sections) {
        setStudyData(response.data);
        setCurrentPage('meditation');
        setCurrentSection(0);
        console.log('✅ Study generated successfully');
      } else {
        throw new Error('Format de réponse invalide');
      }

    } catch (error) {
      clearInterval(progressInterval);
      console.error('❌ API Connection Error:', error);
      
      let errorMessage = 'Erreur lors de la génération de l\'étude. Veuillez réessayer.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout: La génération prend trop de temps. Réessayez.';
      } else if (error.response) {
        errorMessage = `Erreur ${error.response.status}: ${error.response.data?.detail || 'Erreur serveur'}`;
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
      
      setError(errorMessage);
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset study
  const resetStudy = () => {
    setStudyData(null);
    setCurrentPage('home');
    setCurrentSection(0);
    setProgress(0);
    setError('');
  };

  // Navigation handlers
  const goToNextSection = () => {
    if (currentSection < 28) {
      setCurrentSection(currentSection + 1);
    }
  };

  const goToPrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  // Render current section content
  const renderCurrentSection = () => {
    if (!studyData || !studyData.sections) return null;

    const sectionData = studyData.sections[currentSection.toString()];
    if (!sectionData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            Point {currentSection} / 28
          </Badge>
          <div className="text-sm text-muted-foreground">
            Sauvegarde auto (2s) après saisie.
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {sectionData.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {sectionData.content}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrevSection}
            disabled={currentSection === 0}
          >
            ◀ Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Section {currentSection + 1} sur 29
          </span>
          <Button
            variant="outline"
            onClick={goToNextSection}
            disabled={currentSection === 28}
          >
            Suivant ▶
          </Button>
        </div>
      </div>
    );
  };

  // Render home page
  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Book className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Bible Étude</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center mb-8 space-x-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-sm font-medium">Passage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm text-gray-600">Génération</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm text-gray-600">Méditation</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Sélection du Passage Biblique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Book/Chapter/Verse Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Livre</label>
                  <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un livre" />
                    </SelectTrigger>
                    <SelectContent>
                      {bibleBooks.map((book) => (
                        <SelectItem key={book} value={book}>{book}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Chapitre</label>
                  <Select value={selectedChapter} onValueChange={setSelectedChapter} disabled={!selectedBook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chapitre" />
                    </SelectTrigger>
                    <SelectContent>
                      {getChapterOptions().map((chapter) => (
                        <SelectItem key={chapter} value={chapter.toString()}>{chapter}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Verset (optionnel)</label>
                  <Select value={selectedVerse} onValueChange={setSelectedVerse} disabled={!selectedChapter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Verset" />
                    </SelectTrigger>
                    <SelectContent>
                      {getVerseOptions().map((verse) => (
                        <SelectItem key={verse} value={verse.toString()}>{verse}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Manual passage input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ou saisir directement le passage</label>
                <Input
                  placeholder="Ex: Jean 3:16, Genèse 1, Psaume 23..."
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                />
              </div>

              {/* Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Densité</label>
                  <Select value={density} onValueChange={setDensity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1500">1500</SelectItem>
                      <SelectItem value="2500">2500</SelectItem>
                      <SelectItem value="5000">5000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Modèle</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ChatGPT">ChatGPT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Error display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Progress */}
              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <div className="text-center text-sm text-muted-foreground">
                    Génération en cours... {progress}%
                  </div>
                </div>
              )}

              {/* Generate button */}
              <Button 
                onClick={generateStudy} 
                disabled={isGenerating || !passage.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  'Générer'
                )}
              </Button>

              {/* Last study info */}
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">Dernière étude</div>
                <Button variant="link" onClick={resetStudy}>Reset</Button>
              </div>
            </CardContent>
          </Card>

          {/* Welcome message */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">🙏 Bienvenue dans votre Espace d'Étude Biblique</h2>
                <p className="text-muted-foreground">
                  Cet outil vous accompagne dans la méditation approfondie des Écritures avec une approche théologique rigoureuse.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📖</div>
                    <h3 className="font-semibold">29 Rubriques Théologiques</h3>
                    <p className="text-sm text-muted-foreground">Chaque section explore un aspect spécifique de votre passage biblique</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔗</div>
                    <h3 className="font-semibold">Liens YouVersion Automatiques</h3>
                    <p className="text-sm text-muted-foreground">Toutes les références bibliques deviennent des liens cliquables</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎓</div>
                    <h3 className="font-semibold">Analyse de Niveau Doctoral</h3>
                    <p className="text-sm text-muted-foreground">Contenu théologique rigoureux adapté à chaque passage</p>
                  </div>
                </div>

                <div className="mt-6 text-left">
                  <h4 className="font-semibold mb-2">Pour commencer :</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Saisissez un passage biblique (ex: "Jean 3", "Genèse 1")</li>
                    <li>2. Choisissez votre densité préférée</li>
                    <li>3. Cliquez sur "Générer" pour obtenir votre étude complète</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Render meditation page
  const renderMeditationPage = () => (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/50 min-h-screen p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setCurrentPage('home')}>
                <Home className="h-4 w-4" />
                Accueil
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            <div className="text-center">
              <h2 className="font-semibold">Méditation</h2>
              <p className="text-sm text-muted-foreground">{studyData?.passage}</p>
            </div>

            <Separator />

            {/* Sections navigation */}
            <div className="space-y-1">
              {sectionTitles.map((title, index) => (
                <Button
                  key={index}
                  variant={currentSection === index ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => setCurrentSection(index)}
                >
                  <span className="text-xs mr-2">{index}.</span>
                  <span className="truncate">{title}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          {renderCurrentSection()}
        </div>
      </div>
    </div>
  );

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {currentPage === 'home' && renderHomePage()}
      {currentPage === 'meditation' && renderMeditationPage()}
      
      {/* Footer */}
      <div className="fixed bottom-4 right-4">
        <a 
          href="https://app.emergent.sh/?utm_source=emergent-badge"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <img 
            src="https://avatars.githubusercontent.com/in/1201222?s=120&u=2686cf91179bbafbc7a71bfbc43004cf9ae1acea&v=4" 
            alt="Emergent"
            className="w-6 h-6"
          />
          Made with Emergent
        </a>
      </div>
    </div>
  );
}

export default App;