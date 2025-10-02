import React from 'react';

const RubriquePage = ({ 
  onGoBack, 
  rubriqueNumber, 
  rubriqueTitle, 
  content, 
  bookInfo,
  onNavigateToRubrique,
  // Nouvelles props pour les boutons fonctionnels
  selectedBook = "Genèse",
  selectedChapter = "1",
  selectedVerse = "--",
  selectedLength = 500,
  setCurrentPage,
  API_BASE,
  setContent,
  setRubriquesStatus,
  setIsLoading,
  isLoading = false,
  BASE_RUBRIQUES = []
}) => {
  
  // Debug: Afficher le contenu reçu
  console.log(`[RUBRIQUE PAGE DEBUG] Rubrique ${rubriqueNumber}:`);
  console.log(`[RUBRIQUE PAGE DEBUG] Content type:`, typeof content);
  console.log(`[RUBRIQUE PAGE DEBUG] Content length:`, content ? content.length : 0);
  console.log(`[RUBRIQUE PAGE DEBUG] Content preview:`, content ? content.slice(0, 100) + "..." : "VIDE");
  console.log(`[RUBRIQUE PAGE DEBUG] Content truthy:`, !!content);

  // État pour le modal API
  const [isApiModalOpen, setIsApiModalOpen] = React.useState(false);
  const [apiStatus, setApiStatus] = React.useState(null);
  const [apiHistory, setApiHistory] = React.useState(null);

  // Fonctions pour gérer le modal API
  const fetchApiStatus = async () => {
    if (!API_BASE) return;
    try {
      const response = await fetch(`${API_BASE}/api-status`);
      if (response.ok) {
        const status = await response.json();
        setApiStatus(status);
        console.log('[RUBRIQUE API] Statut récupéré:', status);
      }
    } catch (error) {
      console.error('[RUBRIQUE API] Erreur statut:', error);
    }
  };

  const fetchApiHistory = async () => {
    if (!API_BASE) return;
    try {
      const response = await fetch(`${API_BASE}/api-history`);
      if (response.ok) {
        const history = await response.json();
        setApiHistory(history);
        console.log('[RUBRIQUE API] Historique récupéré:', history);
      }
    } catch (error) {
      console.error('[RUBRIQUE API] Erreur historique:', error);
    }
  };

  // Charger les données API au montage du composant
  React.useEffect(() => {
    if (isApiModalOpen) {
      fetchApiStatus();
      fetchApiHistory();
    }
  }, [isApiModalOpen, API_BASE]);

  // Fonctions utilitaires pour l'affichage API
  const getLedColor = (api) => {
    return api.color === 'green' ? '#00ff00' : '#ff0000';
  };

  const ledStyle = (color) => ({
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: color,
    marginRight: '12px',
    boxShadow: `0 0 8px ${color}`,
    animation: 'pulse-led 2s infinite ease-in-out'
  });

  const getStatusIcon = (api) => {
    return api.color === 'green' ? '✅' : '❌';
  };

  // Fonctions de gestion des boutons - COPIÉES DE LA PAGE PRINCIPALE

  // 1. Fonction Gemini (copiée de App.js)
  const handleGeminiAction = async () => {
    if (!API_BASE || !setContent || !setRubriquesStatus || !setIsLoading) {
      console.warn("[RUBRIQUE] API functions not available");
      return;
    }

    try {
      setIsLoading(true); 
      setContent("Enrichissement théologique avec votre Gemini gratuit en cours...");
      setRubriquesStatus(p => ({ ...p, [rubriqueNumber]: "in-progress" }));

      const passage = (selectedVerse === "--" || selectedVerse === "vide")
        ? `${selectedBook} ${selectedChapter}`
        : `${selectedBook} ${selectedChapter}:${selectedVerse}`;

      // Enrichir théologiquement avec votre clé Gemini gratuite
      if (rubriqueNumber >= 1 && rubriqueNumber <= 28) {
        const rubriqueTitle = BASE_RUBRIQUES[rubriqueNumber] || `Rubrique ${rubriqueNumber}`;
        
        // Générer un enrichissement théologique avec longueur augmentée
        const enrichedLength = Math.min(2000, parseInt(selectedLength) + 500);
        console.log(`[ENRICHISSEMENT GEMINI GRATUIT] Rubrique ${rubriqueNumber} - Longueur enrichie: ${enrichedLength} caractères`);
        
        // Appeler votre backend avec votre clé Gemini gratuite
        const response = await fetch(`${API_BASE}/generate-verse-by-verse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passage: passage,
            tokens: enrichedLength,
            use_gemini: true,
            enriched: true,
            rubrique_context: rubriqueTitle
          })
        });

        if (response.ok) {
          const data = await response.json();
          const enrichedContent = data.content || "Contenu enrichi non disponible";
          
          console.log(`[ENRICHISSEMENT GEMINI GRATUIT] Contenu enrichi reçu: ${enrichedContent.length} caractères`);
          setContent(enrichedContent);
          setRubriquesStatus(p => ({ ...p, [rubriqueNumber]: "completed" }));
        } else {
          throw new Error(`Erreur API: ${response.status}`);
        }
      }
    } catch (err) {
      console.error("Erreur enrichissement Gemini:", err);
      setContent(`Erreur lors de l'enrichissement Gemini: ${err.message}`);
      setRubriquesStatus(p => ({ ...p, [rubriqueNumber]: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fonction ChatGPT (copiée de App.js)
  const handleChatGPTAction = () => {
    window.open('https://chatgpt.com/', '_blank');
  };

  // 3. Fonction Notes (copiée de App.js)  
  const handleNotesAction = () => {
    if (setCurrentPage) {
      setCurrentPage('notes');
    } else {
      console.warn("[RUBRIQUE] setCurrentPage not available");
    }
  };

  // 4. Fonction API Control Panel (basée sur ApiControlPanel)
  const handleApiAction = () => {
    console.log('[CONTROL BUTTON] API button clicked for Rubrique', rubriqueNumber);
    setIsApiModalOpen(true);
  };

  // 5. Nouvelle fonction "Lire la Bible" (copiée de App.js)
  const handleBibleAction = () => {
    if (selectedBook === "--") {
      alert("Veuillez d'abord sélectionner un livre de la Bible");
      return;
    }
    
    const bookCodes = {
      "Genèse":"GEN","Exode":"EXO","Lévitique":"LEV","Nombres":"NUM","Deutéronome":"DEU",
      "Josué":"JOS","Juges":"JDG","Ruth":"RUT","1 Samuel":"1SA","2 Samuel":"2SA",
      "1 Rois":"1KI","2 Rois":"2KI","1 Chroniques":"1CH","2 Chroniques":"2CH",
      "Esdras":"EZR","Néhémie":"NEH","Esther":"EST","Job":"JOB","Psaumes":"PSA",
      "Proverbes":"PRO","Ecclésiaste":"ECC","Cantique des cantiques":"SNG",
      "Ésaïe":"ISA","Jérémie":"JER","Lamentations":"LAM","Ézéchiel":"EZK","Daniel":"DAN",
      "Osée":"HOS","Joël":"JOL","Amos":"AMO","Abdias":"OBA","Jonas":"JON","Michée":"MIC",
      "Nahum":"NAM","Habacuc":"HAB","Sophonie":"ZEP","Aggée":"HAG","Zacharie":"ZEC","Malachie":"MAL",
      "Matthieu":"MAT","Marc":"MRK","Luc":"LUK","Jean":"JHN","Actes":"ACT",
      "Romains":"ROM","1 Corinthiens":"1CO","2 Corinthiens":"2CO","Galates":"GAL",
      "Éphésiens":"EPH","Philippiens":"PHP","Colossiens":"COL","1 Thessaloniciens":"1TH",
      "2 Thessaloniciens":"2TH","1 Timothée":"1TI","2 Timothée":"2TI","Tite":"TIT",
      "Philémon":"PHM","Hébreux":"HEB","Jacques":"JAS","1 Pierre":"1PE","2 Pierre":"2PE",
      "1 Jean":"1JN","2 Jean":"2JN","3 Jean":"3JN","Jude":"JUD","Apocalypse":"REV"
    };
    
    const code = bookCodes[selectedBook]; 
    if (!code) {
      alert("Livre non reconnu pour YouVersion");
      return;
    }
    
    let url = `https://www.bible.com/fr/bible/63/${code}`;
    if (selectedChapter !== "--") { 
      url += `.${selectedChapter}`; 
      if (selectedVerse !== "--") url += `.${selectedVerse}`; 
    }
    window.open(url, "_blank");
  };
  
  const getRubriqueColor = (number) => {
    // Couleurs variées pour les différentes rubriques
    const colors = {
      1: { start: '#8b5cf6', end: '#7c3aed', name: 'Violet' },
      2: { start: '#3b82f6', end: '#2563eb', name: 'Bleu' },
      3: { start: '#10b981', end: '#059669', name: 'Vert' },
      4: { start: '#f59e0b', end: '#d97706', name: 'Orange' },
      5: { start: '#ef4444', end: '#dc2626', name: 'Rouge' },
      6: { start: '#8b5cf6', end: '#7c3aed', name: 'Violet' },
      7: { start: '#06b6d4', end: '#0891b2', name: 'Cyan' },
      8: { start: '#84cc16', end: '#65a30d', name: 'Lime' },
      9: { start: '#f97316', end: '#ea580c', name: 'Orange' },
      10: { start: '#ec4899', end: '#db2777', name: 'Rose' },
      // Cycle pour les rubriques suivantes
      default: { start: '#6b7280', end: '#4b5563', name: 'Gris' }
    };
    
    return colors[number] || colors[((number - 1) % 10) + 1] || colors.default;
  };

  const rubriqueColor = getRubriqueColor(rubriqueNumber);

  const formatRubriqueContent = (content) => {
    if (!content) return '';
    
    // Formatage simple pour le contenu des rubriques
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.95) 50%, rgba(248, 250, 252, 0.98) 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* En-tête coloré selon la rubrique */}
      <div style={{
        background: `linear-gradient(135deg, ${rubriqueColor.start} 0%, ${rubriqueColor.end} 100%)`,
        color: 'white',
        padding: '30px 20px',
        boxShadow: `0 8px 32px ${rubriqueColor.start}40`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
          pointerEvents: 'none'
        }}></div>
        
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10
        }}>
          <button 
            onClick={onGoBack}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            ← Retour à l'Étude
          </button>
          
          {/* Titre et boutons de contrôle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: '800',
                margin: '0 0 8px 0',
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                📋 Rubrique {rubriqueNumber}
              </h1>
              
              <div style={{
                fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                textAlign: 'center',
                opacity: 0.9,
                fontWeight: '500'
              }}>
                {rubriqueTitle}
              </div>
            </div>

            {/* 5 boutons de contrôle */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {/* Bouton Gemini */}
              <button
                onClick={handleGeminiAction}
                className="btn-gemini control-btn"
                disabled={isLoading}
                title="Enrichissement théologique avec Gemini"
              >
                🤖 Gemini
              </button>

              {/* Bouton ChatGPT */}
              <button
                onClick={handleChatGPTAction}
                className="btn-chat control-btn"
                title="Ouvrir ChatGPT dans un nouvel onglet"
              >
                💬 ChatGPT
              </button>

              {/* Bouton Prise de Note */}
              <button
                onClick={handleNotesAction}
                className="btn-notes control-btn"
                title="Ouvrir la page de prise de notes"
              >
                📝 Notes
              </button>

              {/* Bouton Lire la Bible */}
              <button
                onClick={handleBibleAction}
                className="btn-read control-btn"
                title="Ouvrir ce passage sur YouVersion"
              >
                📖 Bible
              </button>

              {/* Bouton API */}
              <button
                onClick={handleApiAction}
                className="control-btn api-btn"
                title="Accéder au panneau de contrôle des API"
                style={{
                  background: 'linear-gradient(135deg, #3742fa, #2f3542)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(55,66,250,0.25)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backdropFilter: 'blur(10px)',
                  minWidth: '70px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.02)';
                  e.target.style.boxShadow = '0 6px 20px rgba(55,66,250,0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 4px 12px rgba(55,66,250,0.25)';
                }}
              >
                🔧 API
              </button>
            </div>
          </div>

          {bookInfo && (
            <div style={{
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              textAlign: 'center',
              opacity: 0.8,
              fontWeight: '400'
            }}>
              {bookInfo}
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {content && content.trim().length > 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'clamp(20px, 5vw, 40px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            lineHeight: '1.7',
            fontSize: 'clamp(15px, 4vw, 16px)',
            marginBottom: '20px'
          }}>
            <div 
              dangerouslySetInnerHTML={{ __html: `<p>${formatRubriqueContent(content)}</p>` }}
              style={{ color: '#374151' }}
            />
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: 'clamp(40px, 8vw, 60px)',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              fontSize: 'clamp(3rem, 8vw, 4rem)',
              marginBottom: '20px'
            }}>⚡</div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              color: '#1f2937',
              marginBottom: '16px',
              fontWeight: '700'
            }}>
              Génération en cours...
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: 'clamp(1rem, 3vw, 1.1rem)',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              🔄 Génération automatique du contenu théologique pour "{rubriqueTitle}"...
            </p>
            <div style={{
              marginTop: '20px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              ✨ Votre contenu authentique sera disponible dans quelques instants
            </div>
          </div>
        )}

        {/* Navigation entre rubriques */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginTop: '30px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Bouton Précédent */}
          {rubriqueNumber > 1 && (
            <button
              onClick={() => onNavigateToRubrique(rubriqueNumber - 1)}
              style={{
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                border: 'none',
                padding: 'clamp(12px, 3vw, 16px) clamp(20px, 5vw, 32px)',
                borderRadius: '12px',
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 16px rgba(107, 114, 128, 0.25)',
                minWidth: '160px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 24px rgba(107, 114, 128, 0.35)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(107, 114, 128, 0.25)';
              }}
            >
              ◀ Rubrique {rubriqueNumber - 1}
            </button>
          )}

          {/* Bouton Suivant */}
          {rubriqueNumber < 28 && (
            <button
              onClick={() => onNavigateToRubrique(rubriqueNumber + 1)}
              style={{
                background: `linear-gradient(135deg, ${rubriqueColor.start} 0%, ${rubriqueColor.end} 100%)`,
                color: 'white',
                border: 'none',
                padding: 'clamp(12px, 3vw, 16px) clamp(20px, 5vw, 32px)',
                borderRadius: '12px',
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: `0 4px 16px ${rubriqueColor.start}40`,
                minWidth: '160px'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 6px 24px ${rubriqueColor.start}50`;
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 4px 16px ${rubriqueColor.start}40`;
              }}
            >
              Rubrique {rubriqueNumber + 1} ▶
            </button>
          )}
        </div>

        {/* Indicateur de position */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: 'clamp(12px, 3vw, 14px)',
          color: '#6b7280'
        }}>
          📋 Rubrique {rubriqueNumber} sur 28 • Étude complète en 28 points
        </div>
      </div>

      {/* Modal API Control Panel */}
      {isApiModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            position: 'relative'
          }}>
            {/* CSS pour les animations LED */}
            <style>
              {`
                @keyframes pulse-led {
                  0% { 
                    box-shadow: 0 0 8px currentColor; 
                    opacity: 1; 
                    transform: scale(1);
                  }
                  50% { 
                    box-shadow: 0 0 20px currentColor, 0 0 40px currentColor; 
                    opacity: 0.4; 
                    transform: scale(1.2);
                  }
                }
              `}
            </style>

            {/* En-tête du modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
              paddingBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                color: '#333',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔧 API Status - Rubrique {rubriqueNumber}
              </h3>
              <button
                onClick={() => setIsApiModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'color 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.color = '#333'}
                onMouseOut={(e) => e.target.style.color = '#999'}
              >
                ✕
              </button>
            </div>

            {/* Contenu du statut API */}
            {apiStatus ? (
              <div>
                {/* Liste des 5 APIs avec leurs couleurs */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#666', 
                    fontSize: '14px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    État des APIs ({Object.keys(apiStatus.apis).length} APIs configurées)
                  </h4>
                  
                  {Object.entries(apiStatus.apis).map(([key, api]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px',
                        marginBottom: '8px',
                        background: api.color === 'green' ? 'rgba(0, 255, 0, 0.08)' : 'rgba(255, 0, 0, 0.08)',
                        border: `2px solid ${api.color === 'green' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
                        borderRadius: '10px',
                        transition: 'all 0.3s ease',
                        boxShadow: `0 2px 8px ${api.color === 'green' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'}`
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={ledStyle(getLedColor(api))} />
                          <span style={{
                            fontWeight: 'bold',
                            color: '#333',
                            marginRight: '12px',
                            fontSize: '14px'
                          }}>
                            {api.name}
                          </span>
                          {key === apiStatus.active_api && (
                            <span style={{
                              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                              color: 'white',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#666', 
                          marginLeft: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span>✅ {api.success_count} succès</span>
                          <span>❌ {api.error_count} échecs</span>
                          {api.last_used && (
                            <span>🕒 {new Date(api.last_used).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '12px',
                          color: api.color === 'green' ? '#4CAF50' : '#f44336',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {api.status === 'available' ? 'Disponible' : 'Quota Dépassé'}
                        </span>
                        <span style={{ fontSize: '18px' }}>
                          {getStatusIcon(api)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Informations générales */}
                <div style={{
                  background: 'rgba(55, 66, 250, 0.05)',
                  border: '1px solid rgba(55, 66, 250, 0.2)',
                  borderRadius: '10px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h5 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#3742fa', 
                    fontSize: '13px',
                    fontWeight: 'bold' 
                  }}>
                    📊 Statistiques Globales
                  </h5>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <span>🔄 API Active: {apiStatus.active_api || 'Aucune'}</span>
                    <span>⚡ Fallback: {apiStatus.fallback_active ? 'Activé' : 'Disponible'}</span>
                    <span>🎯 Contexte: Rubrique {rubriqueNumber} - {rubriqueTitle}</span>
                  </div>
                </div>

                {/* Bouton de rafraîchissement */}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    onClick={() => {
                      fetchApiStatus();
                      fetchApiHistory();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #3742fa, #2f3542)',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🔄 Actualiser
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚙️</div>
                <p style={{ color: '#666', margin: 0 }}>Chargement du statut des APIs...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RubriquePage;