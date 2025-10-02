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
        : "https://faithai-tools.preview.emergentagent.com/api/generate-verse-by-verse";
      
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
        : "https://faithai-tools.preview.emergentagent.com/api/generate-verse-by-verse";
      
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

  // Fonction pour gérer l'enrichissement d'un verset via React (pas via HTML onclick)
  const handleEnrichirVerset = async (versetNumber) => {
    console.log(`[GEMINI] Clic enrichissement verset ${versetNumber}`);
    
    // Extraire le texte du verset et l'explication actuelle
    const currentContent = getCurrentBatchContent();
    const versetRegex = new RegExp(`VERSET ${versetNumber}[\\s\\S]*?TEXTE BIBLIQUE[\\s\\S]*?:([\\s\\S]*?)EXPLICATION THÉOLOGIQUE[\\s\\S]*?:([\\s\\S]*?)(?=VERSET|$)`, 'i');
    const match = currentContent.match(versetRegex);
    
    if (match) {
      const versetText = match[1].trim();
      const currentExplication = match[2].trim();
      
      await enrichirExplicationGemini(versetNumber, currentExplication, versetText);
    }
  };
  
  // Fonction pour nettoyer les marqueurs Markdown
  const cleanMarkdownFormatting = (text) => {
    if (!text) return '';
    
    return text
      // Supprimer les ** pour le gras
      .replace(/\*\*/g, '')
      // Supprimer les * pour l'italique
      .replace(/(?<!\*)\*(?!\*)/g, '')
      // Nettoyer les espaces multiples
      .replace(/\s+/g, ' ')
      // Nettoyer les lignes vides multiples
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  };

  // Nouvelle approche : Analyser le contenu et créer des composants React avec boutons intégrés
  const parseContentWithGeminiButtons = (content) => {
    if (!content) return [];
    
    const sections = [];
    const versetPattern = /(\*\*VERSET\s+(\d+)\*\*[\s\S]*?)(?=\*\*VERSET\s+\d+|$)/gi;
    
    let match;
    while ((match = versetPattern.exec(content)) !== null) {
      const versetNumber = parseInt(match[2]);
      const versetContent = match[1].trim();
      
      // Séparer le contenu en parties
      const parts = versetContent.split(/(\*\*TEXTE BIBLIQUE\s*:\*\*|\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*)/i);
      
      let versetTitle = '';
      let texteContent = '';
      let explicationContent = '';
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        
        if (part.includes('**VERSET')) {
          versetTitle = cleanMarkdownFormatting(part);
        } else if (part.match(/TEXTE BIBLIQUE/i)) {
          texteContent = cleanMarkdownFormatting(parts[i + 1]?.trim() || '');
          i++; // Skip next part as we've consumed it
        } else if (part.match(/\*\*EXPLICATION THÉOLOGIQUE/i)) {
          explicationContent = cleanMarkdownFormatting(parts[i + 1]?.trim() || '');
          i++; // Skip next part as we've consumed it
        }
      }
      
      sections.push({
        number: versetNumber,
        title: versetTitle,
        texte: texteContent,
        explication: explicationContent
      });
    }
    
    return sections;
  };

  // Fonction pour extraire les numéros de versets du contenu
  const extractVersetNumbers = (content) => {
    if (!content) return [];
    
    const versetPattern = /\*\*VERSET\s+(\d+)\*\*/gi;
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
            {/* Nouveau rendu avec boutons intégrés */}
            {parseContentWithGeminiButtons(getCurrentBatchContent()).map((section, index) => (
              <div key={section.number} style={{ marginBottom: '40px' }}>
                {/* Titre du verset */}
                <div className="verset-header">
                  {section.title}
                </div>
                
                {/* Texte biblique */}
                {section.texte && (
                  <>
                    <div className="texte-biblique-label">TEXTE BIBLIQUE :</div>
                    <div style={{ 
                      marginBottom: '20px', 
                      padding: '10px 0',
                      color: '#374151'
                    }}>
                      {section.texte}
                    </div>
                  </>
                )}
                
                {/* Explication théologique avec bouton Gemini intégré */}
                {section.explication && (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '15px',
                      marginBottom: '16px',
                      flexWrap: 'wrap'
                    }}>
                      <div className="explication-label" style={{ flex: '1', minWidth: '200px' }}>
                        EXPLICATION THÉOLOGIQUE :
                      </div>
                      
                      {/* Bouton Gemini à droite de l'explication */}
                      <button 
                        onClick={() => handleEnrichirVerset(section.number)}
                        disabled={enrichingVersets[`${currentBatch}-${section.number}`]}
                        style={{
                          background: enrichingVersets[`${currentBatch}-${section.number}`]
                            ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                            : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          color: 'white',
                          border: 'none',
                          padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 18px)',
                          borderRadius: '8px',
                          fontSize: 'clamp(12px, 3vw, 14px)',
                          fontWeight: '600',
                          cursor: enrichingVersets[`${currentBatch}-${section.number}`] ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 3px 12px rgba(139, 92, 246, 0.25)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          opacity: enrichingVersets[`${currentBatch}-${section.number}`] ? 0.7 : 1
                        }}
                        onMouseOver={(e) => {
                          if (!enrichingVersets[`${currentBatch}-${section.number}`]) {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.35)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!enrichingVersets[`${currentBatch}-${section.number}`]) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 3px 12px rgba(139, 92, 246, 0.25)';
                          }
                        }}
                      >
                        {enrichingVersets[`${currentBatch}-${section.number}`] 
                          ? '⏳ Gemini...' 
                          : '🤖 Gemini gratuit'
                        }
                      </button>
                    </div>
                    
                    {/* Contenu de l'explication */}
                    <div style={{ 
                      color: '#374151',
                      lineHeight: '1.7',
                      marginBottom: '10px'
                    }}>
                      {section.explication.split('\n').map((line, lineIndex) => (
                        <React.Fragment key={lineIndex}>
                          {line}
                          {lineIndex < section.explication.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    {/* Indicateur de chargement */}
                    {enrichingVersets[`${currentBatch}-${section.number}`] && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '12px',
                        color: '#6b7280',
                        fontSize: 'clamp(12px, 3vw, 14px)',
                        justifyContent: 'center',
                        padding: '10px',
                        background: 'rgba(139, 92, 246, 0.05)',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #e5e7eb',
                          borderTop: '2px solid #8b5cf6',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        Enrichissement en cours avec Gemini...
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            
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
            
            {/* Styles CSS intégrés pour les couleurs */}
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
                
                .explication-label {
                  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                  color: white;
                  font-size: clamp(1rem, 3.5vw, 1.1rem);
                  font-weight: 700;
                  padding: clamp(10px, 3vw, 12px) clamp(16px, 4vw, 20px);
                  border-radius: 10px;
                  margin: clamp(20px, 5vw, 24px) 0 clamp(12px, 3vw, 16px) 0;
                  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                .verset-content p {
                  margin-bottom: clamp(16px, 4vw, 18px);
                  line-height: 1.7;
                  font-size: clamp(15px, 4vw, 16px);
                }
                
                .verset-content br {
                  line-height: 1.7;
                }
                
                /* Animation spin pour les loadings */
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                
                /* Responsive mobile - lecture optimisée */
                @media (max-width: 768px) {
                  .verset-header {
                    margin: 20px 0 16px 0;
                    border-radius: 8px;
                  }
                  
                  .texte-biblique-label,
                  .explication-label {
                    margin: 16px 0 12px 0;
                    border-radius: 8px;
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