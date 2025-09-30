import React, { useState, useEffect } from 'react';

const BibleConcordancePage = ({ onGoBack }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    <div style={styles.bibleConcordancePage}>
      {/* En-tête avec navigation */}
      <div style={styles.concordanceHeader}>
        <button style={styles.backButton} onClick={onGoBack}>
          ← Retour à l'Étude
        </button>
        <h1 style={styles.concordanceTitle}>
          📖 Bible de Concordance
        </h1>
        <div style={styles.concordanceSubtitle}>
          Explorez la richesse des Écritures par mots-clés
        </div>
      </div>

      {/* Section de recherche */}
      <div style={styles.concordanceSearchSection}>
        <form onSubmit={handleSearchSubmit} style={styles.searchForm}>
          <div style={styles.searchInputContainer}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un mot ou concept dans la Bible..."
              style={styles.searchInput}
              autoFocus
            />
            <button 
              type="submit" 
              style={styles.searchButton}
              disabled={isLoading || searchTerm.trim().length < 2}
            >
              {isLoading ? "⏳" : "🔍"} Rechercher
            </button>
          </div>
        </form>

        {/* Boutons de suggestion */}
        <div style={styles.suggestionsSection}>
          <h3 style={styles.suggestionsTitle}>💡 Suggestions de recherche :</h3>
          <div style={styles.suggestionButtons}>
            {["amour", "paix", "joie", "foi", "espoir", "grâce", "Dieu", "Jésus", "salut", "prière"].map(term => (
              <button 
                key={term}
                style={styles.suggestionButton}
                onClick={() => handleSuggestionClick(term)}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                  e.target.style.color = 'white';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#7c3aed';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Lien externe YouVersion */}
        <div style={{textAlign: 'center'}}>
          <button
            style={styles.youversionButton}
            onClick={openYouVersionConcordance}
            title="Ouvrir dans YouVersion pour plus de résultats"
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 24px rgba(5, 150, 105, 0.35)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px rgba(5, 150, 105, 0.25)';
            }}
          >
            🌐 Rechercher aussi sur YouVersion
          </button>
        </div>
      </div>

      {/* Section des résultats */}
      <div style={styles.resultsSection}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={{...styles.loadingSpinner, animation: 'spin 1s linear infinite'}}></div>
            <p style={{color: '#64748b', fontSize: '16px', fontWeight: '500'}}>Recherche en cours dans les Écritures...</p>
            <style>
              {`@keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }`}
            </style>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div style={{textAlign: 'center', marginBottom: '32px', padding: '24px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'}}>
              <h2 style={{fontSize: '1.8rem', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0'}}>
                📋 Résultats trouvés ({results.length})
              </h2>
              <p style={{color: '#64748b', fontSize: '16px', margin: '0', fontWeight: '500'}}>
                Versets contenant "{searchTerm}"
              </p>
            </div>
            
            <div style={styles.versesGrid}>
              {results.map((verse, index) => (
                <div 
                  key={index} 
                  style={{
                    ...styles.verseCard,
                    borderLeft: '4px solid #8b5cf6'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.05), 0 1px 0 rgba(255, 255, 255, 0.5)';
                  }}
                >
                  <div style={styles.verseReference}>
                    <strong>{verse.book} {verse.chapter}:{verse.verse}</strong>
                  </div>
                  <div 
                    style={styles.verseText}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerm(verse.text, searchTerm) 
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : searchTerm.length > 0 ? (
          <div style={{textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'}}>
            <h3 style={{fontSize: '1.5rem', color: '#64748b', margin: '0 0 12px 0', fontWeight: '600'}}>🔍 Aucun résultat trouvé</h3>
            <p style={{color: '#64748b', fontSize: '16px', margin: '0 0 16px 0'}}>
              Aucun verset trouvé pour "<strong>{searchTerm}</strong>"
            </p>
            <p style={{color: '#94a3b8', fontSize: '14px', fontStyle: 'italic', margin: '0'}}>
              Essayez avec des termes comme : amour, paix, Dieu, joie, espoir, foi
            </p>
          </div>
        ) : (
          <div style={styles.welcomeMessage}>
            <div>
              <h2 style={styles.welcomeTitle}>🙏 Bienvenue dans la Concordance Biblique</h2>
              <p style={{color: '#64748b', fontSize: '16px', margin: '0 0 32px 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto'}}>
                Découvrez tous les versets de la Bible contenant un mot ou concept spécifique.
              </p>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', maxWidth: '600px', margin: '0 auto'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)'}}>
                  <span style={{fontSize: '1.5rem', minWidth: '32px', textAlign: 'center'}}>🔍</span>
                  <span style={{color: '#475569', fontWeight: '500', fontSize: '14px'}}>Recherche dans toute la Bible</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)'}}>
                  <span style={{fontSize: '1.5rem', minWidth: '32px', textAlign: 'center'}}>📝</span>
                  <span style={{color: '#475569', fontWeight: '500', fontSize: '14px'}}>Références complètes</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)'}}>
                  <span style={{fontSize: '1.5rem', minWidth: '32px', textAlign: 'center'}}>✨</span>
                  <span style={{color: '#475569', fontWeight: '500', fontSize: '14px'}}>Texte mis en évidence</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.1)'}}>
                  <span style={{fontSize: '1.5rem', minWidth: '32px', textAlign: 'center'}}>🌐</span>
                  <span style={{color: '#475569', fontWeight: '500', fontSize: '14px'}}>Lien vers YouVersion</span>
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