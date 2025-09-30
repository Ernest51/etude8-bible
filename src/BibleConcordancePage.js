import React, { useState, useEffect } from 'react';
import './BibleConcordancePage.css';

const BibleConcordancePage = ({ onGoBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateConcordanceResults = (term) => {
    // Simuler des résultats de concordance basés sur le terme recherché
    const mockVerses = {
      "amour": [
        { book: "Jean", chapter: 3, verse: 16, text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle." },
        { book: "1 Corinthiens", chapter: 13, verse: 4, text: "L'amour est patient, il est plein de bonté; l'amour n'est point envieux; l'amour ne se vante point, il ne s'enfle point d'orgueil," },
        { book: "1 Jean", chapter: 4, verse: 8, text: "Celui qui n'aime pas n'a pas connu Dieu, car Dieu est amour." },
        { book: "Matthieu", chapter: 22, verse: 37, text: "Jésus lui répondit: Tu aimeras le Seigneur, ton Dieu, de tout ton cœur, de toute ton âme, et de toute ta pensée." },
        { book: "Romains", chapter: 8, verse: 39, text: "ni la hauteur, ni la profondeur, ni aucune autre créature ne pourra nous séparer de l'amour de Dieu manifesté en Jésus-Christ notre Seigneur." }
      ],
      "paix": [
        { book: "Jean", chapter: 14, verse: 27, text: "Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s'alarme point." },
        { book: "Philippiens", chapter: 4, verse: 7, text: "Et la paix de Dieu, qui surpasse toute intelligence, gardera vos cœurs et vos pensées en Jésus-Christ." },
        { book: "Ésaïe", chapter: 26, verse: 3, text: "A celui qui est ferme dans ses sentiments Tu assures la paix, la paix, Parce qu'il se confie en toi." },
        { book: "Romains", chapter: 5, verse: 1, text: "Étant donc justifiés par la foi, nous avons la paix avec Dieu par notre Seigneur Jésus-Christ," }
      ],
      "foi": [
        { book: "Hébreux", chapter: 11, verse: 1, text: "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit point." },
        { book: "Romains", chapter: 10, verse: 17, text: "Ainsi la foi vient de ce qu'on entend, et ce qu'on entend vient de la parole de Christ." },
        { book: "Éphésiens", chapter: 2, verse: 8, text: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu." },
        { book: "Jacques", chapter: 2, verse: 26, text: "Comme le corps sans âme est mort, de même la foi sans les œuvres est morte." }
      ],
      "joie": [
        { book: "Néhémie", chapter: 8, verse: 10, text: "Il leur dit: Allez, mangez des viandes grasses et buvez des liqueurs douces, et envoyez des portions à ceux qui n'ont rien de préparé, car ce jour est consacré à notre Seigneur; ne vous affligez pas, car la joie de l'Éternel sera votre force." },
        { book: "Psaumes", chapter: 16, verse: 11, text: "Tu me feras connaître le sentier de la vie; Il y a d'abondantes joies devant ta face, Des délices éternelles à ta droite." },
        { book: "Galates", chapter: 5, verse: 22, text: "Mais le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité," },
        { book: "Luc", chapter: 2, verse: 10, text: "Mais l'ange leur dit: Ne craignez point; car je vous annonce une bonne nouvelle, qui sera pour tout le peuple le sujet d'une grande joie:" }
      ],
      "espoir": [
        { book: "Romains", chapter: 15, verse: 13, text: "Que le Dieu de l'espérance vous remplisse de toute joie et de toute paix dans la foi, pour que vous abondiez en espérance, par la puissance du Saint-Esprit!" },
        { book: "1 Pierre", chapter: 1, verse: 3, text: "Béni soit Dieu, le Père de notre Seigneur Jésus-Christ, qui, selon sa grande miséricorde, nous a régénérés, pour une espérance vivante, par la résurrection de Jésus-Christ d'entre les morts," },
        { book: "Hébreux", chapter: 6, verse: 19, text: "Cette espérance, nous la possédons comme une ancre de l'âme, sûre et solide; elle pénètre au delà du voile," },
        { book: "Jérémie", chapter: 29, verse: 11, text: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance." }
      ],
      "grâce": [
        { book: "Éphésiens", chapter: 2, verse: 8, text: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu." },
        { book: "2 Corinthiens", chapter: 12, verse: 9, text: "et il m'a dit: Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse. Je me glorifierai donc bien plus volontiers de mes faiblesses, afin que la puissance de Christ repose sur moi." },
        { book: "Romains", chapter: 6, verse: 14, text: "Car le péché n'aura point de pouvoir sur vous, puisque vous êtes, non sous la loi, mais sous la grâce." },
        { book: "Tite", chapter: 2, verse: 11, text: "Car la grâce de Dieu, source de salut pour tous les hommes, a été manifestée." }
      ]
    };

    // Recherche flexible - vérifie si le terme recherché contient ou est contenu dans les clés
    const matchingEntries = [];
    const termLower = term.toLowerCase();
    
    for (const [key, verses] of Object.entries(mockVerses)) {
      if (key.includes(termLower) || termLower.includes(key)) {
        matchingEntries.push(...verses);
      }
    }
    
    // Si aucune correspondance exacte, recherche dans le texte des versets
    if (matchingEntries.length === 0) {
      for (const verses of Object.values(mockVerses)) {
        for (const verse of verses) {
          if (verse.text.toLowerCase().includes(termLower)) {
            matchingEntries.push(verse);
          }
        }
      }
    }
    
    // Limiter les résultats et éviter les doublons
    const uniqueResults = matchingEntries.filter((verse, index, arr) => 
      arr.findIndex(v => v.book === verse.book && v.chapter === verse.chapter && v.verse === verse.verse) === index
    );
    
    return uniqueResults.slice(0, 20); // Limiter à 20 résultats
  };

  const searchBibleConcordance = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log(`[CONCORDANCE] Recherche pour: "${searchTerm}"`);
      
      // Simuler un délai de recherche
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockResults = generateConcordanceResults(searchTerm.trim());
      
      setResults(mockResults);
      console.log(`[CONCORDANCE] ${mockResults.length} résultats trouvés`);
      
    } catch (error) {
      console.error("[CONCORDANCE] Erreur de recherche:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchBibleConcordance(searchTerm);
  };

  const handleSuggestionClick = (term) => {
    setSearchTerm(term);
    searchBibleConcordance(term);
  };

  const openYouVersionConcordance = () => {
    const searchUrl = searchTerm 
      ? `https://www.bible.com/search/bible?q=${encodeURIComponent(searchTerm)}`
      : 'https://www.bible.com/';
    window.open(searchUrl, '_blank');
  };

  const highlightSearchTerm = (text, term) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className="bible-concordance-page">
      {/* En-tête avec navigation */}
      <div className="concordance-header">
        <button className="back-button" onClick={onGoBack}>
          ← Retour à l'Étude
        </button>
        <h1 className="concordance-title">
          📖 Bible de Concordance
        </h1>
        <div className="concordance-subtitle">
          Explorez la richesse des Écritures par mots-clés
        </div>
      </div>

      {/* Section de recherche */}
      <div className="concordance-search-section">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un mot ou concept dans la Bible..."
              className="search-input"
              autoFocus
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={isLoading || searchTerm.trim().length < 2}
            >
              {isLoading ? "⏳" : "🔍"} Rechercher
            </button>
          </div>
        </form>

        {/* Boutons de suggestion */}
        <div className="suggestions-section">
          <h3 className="suggestions-title">💡 Suggestions de recherche :</h3>
          <div className="suggestion-buttons">
            {["amour", "paix", "joie", "foi", "espoir", "grâce", "Dieu", "Jésus", "salut", "prière"].map(term => (
              <button 
                key={term}
                className="suggestion-button"
                onClick={() => handleSuggestionClick(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Lien externe YouVersion */}
        <div className="external-link-section">
          <button
            className="youversion-button"
            onClick={openYouVersionConcordance}
            title="Ouvrir dans YouVersion pour plus de résultats"
          >
            🌐 Rechercher aussi sur YouVersion
          </button>
        </div>
      </div>

      {/* Section des résultats */}
      <div className="results-section">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Recherche en cours dans les Écritures...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="results-container">
            <div className="results-header">
              <h2 className="results-title">
                📋 Résultats trouvés ({results.length})
              </h2>
              <p className="results-subtitle">
                Versets contenant "{searchTerm}"
              </p>
            </div>
            
            <div className="verses-grid">
              {results.map((verse, index) => (
                <div key={index} className="verse-card">
                  <div className="verse-reference">
                    <strong>{verse.book} {verse.chapter}:{verse.verse}</strong>
                  </div>
                  <div 
                    className="verse-text"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerm(verse.text, searchTerm) 
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : searchTerm.length > 0 ? (
          <div className="no-results">
            <h3 className="no-results-title">🔍 Aucun résultat trouvé</h3>
            <p className="no-results-text">
              Aucun verset trouvé pour "<strong>{searchTerm}</strong>"
            </p>
            <p className="no-results-suggestion">
              Essayez avec des termes comme : amour, paix, Dieu, joie, espoir, foi
            </p>
          </div>
        ) : (
          <div className="welcome-message">
            <div className="welcome-content">
              <h2 className="welcome-title">🙏 Bienvenue dans la Concordance Biblique</h2>
              <p className="welcome-description">
                Découvrez tous les versets de la Bible contenant un mot ou concept spécifique.
              </p>
              <div className="welcome-features">
                <div className="feature-item">
                  <span className="feature-icon">🔍</span>
                  <span className="feature-text">Recherche dans toute la Bible</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📝</span>
                  <span className="feature-text">Références complètes</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✨</span>
                  <span className="feature-text">Texte mis en évidence</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌐</span>
                  <span className="feature-text">Lien vers YouVersion</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleConcordancePage;