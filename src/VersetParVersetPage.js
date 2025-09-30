import React, { useState, useEffect } from 'react';

const VersetParVersetPage = ({ onGoBack, content, bookInfo }) => {
  const [currentBatch, setCurrentBatch] = useState(1); // Batch actuel (1, 2, 3...)
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allVersetsBatches, setAllVersetsBatches] = useState({}); // Stocke tous les batches chargés
  const [totalVersetsExpected, setTotalVersetsExpected] = useState(null);
  const [enrichingVersets, setEnrichingVersets] = useState({}); // Track quels versets sont en cours d'enrichissement

  useEffect(() => {
    // Quand le contenu arrive, le stocker comme batch 1
    if (content) {
      setAllVersetsBatches(prev => ({
        ...prev,
        1: content
      }));
      setCurrentBatch(1);
    }
  }, [content]);

  // Fonction pour enrichir une explication théologique spécifique avec Gemini
  const enrichirExplicationGemini = async (versetNumber, currentExplication, versetText) => {
    const enrichKey = `${currentBatch}-${versetNumber}`;
    
    if (enrichingVersets[enrichKey]) return; // Déjà en cours
    
    setEnrichingVersets(prev => ({...prev, [enrichKey]: true}));
    
    try {
      console.log(`[GEMINI ENRICHISSEMENT] Enrichissement verset ${versetNumber} batch ${currentBatch}`);
      
      const isLocal = window.location.hostname === 'localhost';
      const apiUrl = isLocal 
        ? "http://localhost:8001/api/generate-verse-by-verse"
        : "https://biblestudy-ai-3.preview.emergentagent.com/api/generate-verse-by-verse";
      
      const prompt = `ENRICHISSEMENT THÉOLOGIQUE APPROFONDI

Verset biblique : "${versetText}"
Explication actuelle : "${currentExplication}"

MISSION : Enrichir et approfondir cette explication théologique avec 200-300 mots supplémentaires.

AJOUTE :
- Contexte historique et culturel
- Liens avec d'autres passages bibliques
- Implications doctrinales profondes
- Applications pratiques modernes
- Perspectives herméneutiques

CONSERVE le texte original ET enrichis-le substantiellement.

GÉNÈRE DIRECTEMENT l'explication enrichie complète :`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          passage: `Enrichissement théologique`,
          version: 'LSG',
          tokens: 300,
          use_gemini: true,
          enriched: true,
          custom_prompt: prompt
        })
      });
      
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      
      const data = await response.json();
      
      if (data.content) {
        // Remplacer l'explication dans le batch actuel
        const currentBatchContent = allVersetsBatches[currentBatch];
        const versetPattern = new RegExp(`(VERSET ${versetNumber}[\\s\\S]*?EXPLICATION THÉOLOGIQUE[\\s\\S]*?:)([\\s\\S]*?)(?=VERSET|$)`, 'i');
        
        const enrichedExplication = data.content.replace(/.*EXPLICATION THÉOLOGIQUE.*?:/i, '').trim();
        const enrichedContent = currentBatchContent.replace(versetPattern, `$1\n${enrichedExplication}\n`);
        
        // Mettre à jour le batch avec le contenu enrichi
        setAllVersetsBatches(prev => ({
          ...prev,
          [currentBatch]: enrichedContent
        }));
        
        console.log(`[GEMINI ENRICHISSEMENT] Verset ${versetNumber} enrichi avec succès`);
      }
      
    } catch (error) {
      console.error(`[GEMINI ENRICHISSEMENT] Erreur verset ${versetNumber}:`, error);
    } finally {
      setEnrichingVersets(prev => ({...prev, [enrichKey]: false}));
    }
  };

  // Fonction pour charger le batch suivant (versets 6-10, 11-15, etc.)
  const loadNextBatch = async () => {
    if (isLoadingMore) return;
    
    const nextBatch = currentBatch + 1;
    
    // Si on a déjà ce batch en cache, l'afficher directement
    if (allVersetsBatches[nextBatch]) {
      setCurrentBatch(nextBatch);
      return;
    }
    
    setIsLoadingMore(true);
    
    try {
      // Calculer le range de versets à demander
      const startVerse = (nextBatch - 1) * 5 + 1; // Batch 2 = versets 6-10, etc.
      const endVerse = startVerse + 4;
      
      // Extraire le livre et chapitre du bookInfo
      const bookChapter = bookInfo?.split(':')[0] || 'Genèse 1';
      const requestPassage = `${bookChapter}:${startVerse}-${endVerse}`;
      
      console.log(`[PAGINATION] Chargement batch ${nextBatch}: ${requestPassage}`);
      
      // Appeler l'API pour les versets suivants
      const isLocal = window.location.hostname === 'localhost';
      const apiUrl = isLocal 
        ? "http://localhost:8001/api/generate-verse-by-verse"
        : "https://biblestudy-ai-3.preview.emergentagent.com/api/generate-verse-by-verse";
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passage: requestPassage,
          version: 'LSG',
          tokens: 500,
          use_gemini: true,
          enriched: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.content) {
        // Stocker le nouveau batch
        setAllVersetsBatches(prev => ({
          ...prev,
          [nextBatch]: data.content
        }));
        setCurrentBatch(nextBatch);
        console.log(`[PAGINATION] Batch ${nextBatch} chargé avec succès`);
      } else {
        throw new Error('Pas de contenu reçu');
      }
      
    } catch (error) {
      console.error(`[PAGINATION] Erreur chargement batch ${nextBatch}:`, error);
      // Optionnel : afficher une erreur à l'utilisateur
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Fonction pour naviguer vers un batch précédent
  const goToPreviousBatch = () => {
    if (currentBatch > 1) {
      setCurrentBatch(currentBatch - 1);
    }
  };

  // Obtenir le contenu du batch actuel
  const getCurrentBatchContent = () => {
    return allVersetsBatches[currentBatch] || '';
  };

  // Exposer la fonction d'enrichissement globalement pour les boutons HTML intégrés
  useEffect(() => {
    window.enrichirVerset = async (versetNumber) => {
      console.log(`[GEMINI] Enrichissement verset ${versetNumber}`);
      
      const buttonEl = document.getElementById(`gemini-btn-${versetNumber}`);
      
      if (buttonEl) {
        buttonEl.textContent = '⏳';
        buttonEl.disabled = true;
        buttonEl.style.opacity = '0.7';
      }
      
      // Extraire le texte du verset et l'explication actuelle
      const currentContent = getCurrentBatchContent();
      const versetRegex = new RegExp(`VERSET ${versetNumber}[\\s\\S]*?TEXTE BIBLIQUE[\\s\\S]*?:([\\s\\S]*?)EXPLICATION THÉOLOGIQUE[\\s\\S]*?:([\\s\\S]*?)(?=VERSET|$)`, 'i');
      const match = currentContent.match(versetRegex);
      
      if (match) {
        const versetText = match[1].trim();
        const currentExplication = match[2].trim();
        
        await enrichirExplicationGemini(versetNumber, currentExplication, versetText);
      }
      
      // Mettre à jour le bouton
      if (buttonEl) {
        buttonEl.textContent = '✅';
        buttonEl.disabled = false;
        buttonEl.style.opacity = '1';
        buttonEl.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      }
    };

    return () => {
      delete window.enrichirVerset;
    };
  }, [currentBatch, allVersetsBatches]);
  
  // Fonction pour formater le contenu avec les bonnes couleurs ET boutons Gemini intégrés
  const formatVersetContent = (content) => {
    if (!content) return '';
    
    let formattedContent = content;
    
    // Étape 1 : Formater les headers de base
    formattedContent = formattedContent
      // VERSET en violet
      .replace(/\*\*(VERSET\s+\d+)\*\*/g, '<div class="verset-header">$1</div>')
      .replace(/(VERSET\s+\d+)/g, '<div class="verset-header">$1</div>')
      
      // TEXTE BIBLIQUE en bleu  
      .replace(/\*\*(TEXTE BIBLIQUE\s*:?)\*\*/g, '<div class="texte-biblique-label">$1</div>')
      .replace(/(TEXTE BIBLIQUE\s*:?)/g, '<div class="texte-biblique-label">$1</div>');
    
    // Étape 2 : EXPLICATION THÉOLOGIQUE avec bouton Gemini intégré à droite
    // Pattern pour capturer VERSET X + contenu + EXPLICATION THÉOLOGIQUE
    const versetExplicationPattern = /(VERSET\s+(\d+)[\s\S]*?)(\*\*(EXPLICATION THÉOLOGIQUE\s*:?)\*\*|\b(EXPLICATION THÉOLOGIQUE\s*:?))/gi;
    
    formattedContent = formattedContent.replace(versetExplicationPattern, (match, precedingContent, versetNumber, fullExplication, boldExplication, normalExplication) => {
      const explicationText = boldExplication || normalExplication || 'EXPLICATION THÉOLOGIQUE :';
      
      return precedingContent + `
        <div class="explication-header-with-button">
          <div class="explication-label">${explicationText}</div>
          <button 
            class="btn-gemini-inline" 
            onclick="window.enrichirVerset(${versetNumber})"
            data-verset="${versetNumber}"
            id="gemini-btn-${versetNumber}"
          >
            🤖 Gemini
          </button>
        </div>`;
    });
    
    // Étape 3 : Gérer les paragraphes
    formattedContent = formattedContent
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    
    return `<div class="verset-content"><p>${formattedContent}</p></div>`;
  };

  // Fonction pour extraire les numéros de versets du contenu
  const extractVersetNumbers = (content) => {
    if (!content) return [];
    
    const versetPattern = /VERSET\s+(\d+)/gi;
    const matches = [];
    let match;
    
    while ((match = versetPattern.exec(content)) !== null) {
      matches.push(parseInt(match[1]));
    }
    
    return matches;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.95) 50%, rgba(248, 250, 252, 0.98) 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* En-tête moderne */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(124, 58, 237, 0.98) 100%)',
        color: 'white',
        padding: '30px 20px',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25)',
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
          
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: '800',
            margin: '0 0 8px 0',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            📖 Étude Verset par Verset
          </h1>
          
          {bookInfo && (
            <div style={{
              fontSize: 'clamp(1rem, 3vw, 1.2rem)',
              textAlign: 'center',
              opacity: 0.9,
              fontWeight: '500'
            }}>
              {bookInfo} • Batch {currentBatch} (versets {(currentBatch - 1) * 5 + 1}-{currentBatch * 5})
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal avec optimisation mobile */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        // Optimisation mobile : padding plus petit sur mobile
        '@media (maxWidth: 768px)': {
          padding: '15px'
        }
      }}>
        {getCurrentBatchContent() ? (
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
            {/* Contenu formaté avec boutons Gemini intégrés */}
            <div 
              dangerouslySetInnerHTML={{ __html: formatVersetContent(getCurrentBatchContent()) }}
              style={{ color: '#374151' }}
            />
            
            {/* Boutons de navigation */}
            <div style={{
              display: 'flex',
              gap: '15px',
              marginTop: '40px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Bouton Précédent */}
              {currentBatch > 1 && (
                <button
                  onClick={goToPreviousBatch}
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
                    minWidth: '140px'
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
                  ◀ Précédent
                </button>
              )}

              {/* Bouton Suivant */}
              <button
                onClick={loadNextBatch}
                disabled={isLoadingMore}
                style={{
                  background: isLoadingMore 
                    ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  padding: 'clamp(12px, 3vw, 16px) clamp(20px, 5vw, 32px)',
                  borderRadius: '12px',
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  fontWeight: '600',
                  cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)',
                  minWidth: '140px',
                  opacity: isLoadingMore ? 0.7 : 1
                }}
                onMouseOver={(e) => {
                  if (!isLoadingMore) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 24px rgba(139, 92, 246, 0.35)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoadingMore) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.25)';
                  }
                }}
              >
                {isLoadingMore ? '⏳ Chargement...' : 'Suivant ▶'}
              </button>
            </div>

            {/* Indicateur de progression */}
            <div style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: '#6b7280'
            }}>
              📖 Batch {currentBatch} • Versets {(currentBatch - 1) * 5 + 1} à {currentBatch * 5}
            </div>
            
            {/* Styles CSS intégrés pour les couleurs ET boutons Gemini intégrés */}
            <style>
              {`
                .verset-header {
                  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                  color: white;
                  font-size: clamp(1.2rem, 4vw, 1.4rem);
                  font-weight: 800;
                  padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 24px);
                  border-radius: 12px;
                  margin: clamp(24px, 6vw, 32px) 0 clamp(16px, 4vw, 20px) 0;
                  text-align: center;
                  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                
                .texte-biblique-label {
                  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                  color: white;
                  font-size: clamp(1rem, 3.5vw, 1.1rem);
                  font-weight: 700;
                  padding: clamp(10px, 3vw, 12px) clamp(16px, 4vw, 20px);
                  border-radius: 10px;
                  margin: clamp(20px, 5vw, 24px) 0 clamp(12px, 3vw, 16px) 0;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                /* Container pour EXPLICATION THÉOLOGIQUE + bouton Gemini */
                .explication-header-with-button {
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: clamp(10px, 3vw, 15px);
                  margin: clamp(20px, 5vw, 24px) 0 clamp(12px, 3vw, 16px) 0;
                }
                
                .explication-label {
                  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                  color: white;
                  font-size: clamp(1rem, 3.5vw, 1.1rem);
                  font-weight: 700;
                  padding: clamp(10px, 3vw, 12px) clamp(16px, 4vw, 20px);
                  border-radius: 10px;
                  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  flex: 1;
                  margin: 0;
                }
                
                /* Bouton Gemini intégré à droite */
                .btn-gemini-inline {
                  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                  color: white;
                  border: none;
                  padding: clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px);
                  border-radius: 8px;
                  font-size: clamp(12px, 3vw, 14px);
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  box-shadow: 0 3px 12px rgba(139, 92, 246, 0.25);
                  min-width: clamp(60px, 15vw, 80px);
                  flex-shrink: 0;
                }
                
                .btn-gemini-inline:hover:not(:disabled) {
                  transform: translateY(-1px);
                  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.35);
                }
                
                .btn-gemini-inline:disabled {
                  opacity: 0.7;
                  cursor: not-allowed;
                  transform: none;
                }
                
                .verset-content p {
                  margin-bottom: clamp(16px, 4vw, 18px);
                  line-height: 1.7;
                  font-size: clamp(15px, 4vw, 16px);
                }
                
                .verset-content br {
                  line-height: 1.7;
                }
                
                /* Responsive mobile - lecture optimisée */
                @media (max-width: 768px) {
                  .verset-header {
                    margin: 20px 0 16px 0;
                    border-radius: 8px;
                  }
                  
                  .texte-biblique-label {
                    margin: 16px 0 12px 0;
                    border-radius: 8px;
                  }
                  
                  .explication-header-with-button {
                    flex-direction: column;
                    gap: 12px;
                    align-items: stretch;
                  }
                  
                  .btn-gemini-inline {
                    align-self: center;
                    min-width: 120px;
                  }
                  
                  .verset-content p {
                    margin-bottom: 14px;
                    text-align: left;
                  }
                }
                
                /* Styles pour très petits écrans */
                @media (max-width: 480px) {
                  .verset-header {
                    font-size: 1.1rem;
                    padding: 10px 14px;
                  }
                  
                  .texte-biblique-label,
                  .explication-label {
                    font-size: 0.95rem;
                    padding: 8px 14px;
                  }
                  
                  .btn-gemini-inline {
                    font-size: 11px;
                    padding: 6px 10px;
                  }
                }
              `}
            </style>
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
            }}>📖</div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              color: '#1f2937',
              marginBottom: '16px',
              fontWeight: '700'
            }}>
              Prêt pour l'Étude Verset par Verset
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: 'clamp(1rem, 3vw, 1.1rem)',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Sélectionnez un passage biblique depuis la page principale pour commencer une étude approfondie verset par verset avec explications théologiques.
              <br /><br />
              <strong>Nouveau :</strong> 5 versets par batch avec navigation fluide !
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersetParVersetPage;