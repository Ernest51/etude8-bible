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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.98) 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* En-tête simple */}
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <button 
          onClick={onGoBack}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          ← Retour à l'Étude
        </button>
        
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          margin: '0 0 10px 0'
        }}>
          📖 Bible de Concordance
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          opacity: 0.9
        }}>
          Explorez les Écritures par mots-clés
        </p>
      </div>

      {/* Zone de recherche */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un mot dans la Bible..."
                style={{
                  flex: 1,
                  padding: '15px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                autoFocus
              />
              <button 
                type="submit" 
                disabled={isLoading || searchTerm.trim().length < 2}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {isLoading ? "⏳" : "🔍"}
              </button>
            </div>
          </form>

          {/* Suggestions simples */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '15px', color: '#6b7280' }}>
              💡 Suggestions: 
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center'
            }}>
              {["amour", "paix", "joie", "foi", "espoir"].map(term => (
                <button 
                  key={term}
                  onClick={() => handleSuggestionClick(term)}
                  style={{
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div style={{ marginTop: '30px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #8b5cf6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p style={{ color: '#6b7280', marginTop: '15px' }}>
                Recherche en cours...
              </p>
            </div>
          ) : results.length > 0 ? (
            <div>
              <h2 style={{
                textAlign: 'center',
                color: 'white',
                fontSize: '1.5rem',
                marginBottom: '20px'
              }}>
                📋 {results.length} résultat(s) pour "{searchTerm}"
              </h2>
              <div style={{
                display: 'grid',
                gap: '20px'
              }}>
                {results.map((verse, index) => (
                  <div 
                    key={index}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      borderLeft: '4px solid #8b5cf6'
                    }}
                  >
                    <div style={{
                      color: '#7c3aed',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '10px'
                    }}>
                      {verse.book} {verse.chapter}:{verse.verse}
                    </div>
                    <div 
                      style={{
                        color: '#374151',
                        lineHeight: '1.6'
                      }}
                      dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(verse.text, searchTerm) 
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : searchTerm.length > 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#6b7280' }}>
                🔍 Aucun résultat pour "{searchTerm}"
              </h3>
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <h2 style={{ color: '#1f2937', marginBottom: '15px' }}>
                🙏 Bienvenue dans la Concordance
              </h2>
              <p style={{ color: '#6b7280' }}>
                Recherchez des mots ou concepts dans la Bible
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BibleConcordancePage;