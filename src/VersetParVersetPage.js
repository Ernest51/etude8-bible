import React, { useState, useEffect } from 'react';

const VersetParVersetPage = ({ onGoBack, content, bookInfo }) => {
  const [currentBatch, setCurrentBatch] = useState(1); // Batch actuel (1, 2, 3...)
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allVersetsBatches, setAllVersetsBatches] = useState({}); // Stocke tous les batches chargés
  const [totalVersetsExpected, setTotalVersetsExpected] = useState(null);

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
  
  // Fonction pour formater le contenu avec les bonnes couleurs
  const formatVersetContent = (content) => {
    if (!content) return '';
    
    // Remplacer les patterns par du HTML avec les bonnes couleurs
    let formattedContent = content
      // VERSET en violet
      .replace(/\*\*(VERSET\s+\d+)\*\*/g, '<div class="verset-header">$1</div>')
      .replace(/(VERSET\s+\d+)/g, '<div class="verset-header">$1</div>')
      
      // TEXTE BIBLIQUE en bleu  
      .replace(/\*\*(TEXTE BIBLIQUE\s*:?)\*\*/g, '<div class="texte-biblique-label">$1</div>')
      .replace(/(TEXTE BIBLIQUE\s*:?)/g, '<div class="texte-biblique-label">$1</div>')
      
      // EXPLICATION THÉOLOGIQUE en orange
      .replace(/\*\*(EXPLICATION THÉOLOGIQUE\s*:?)\*\*/g, '<div class="explication-label">$1</div>')
      .replace(/(EXPLICATION THÉOLOGIQUE\s*:?)/g, '<div class="explication-label">$1</div>')
      
      // Paragraphes
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    
    return `<div class="verset-content"><p>${formattedContent}</p></div>`;
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
        padding: '40px 24px',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.25)',
        position: 'relative',
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
        
        <button 
          onClick={onGoBack}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            position: 'relative',
            zIndex: 10
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
          fontSize: '2.5rem',
          fontWeight: '800',
          margin: '0 0 12px 0',
          textAlign: 'center',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 10
        }}>
          📖 Étude Verset par Verset
        </h1>
        
        {bookInfo && (
          <div style={{
            fontSize: '1.2rem',
            textAlign: 'center',
            opacity: 0.9,
            fontWeight: '500',
            position: 'relative',
            zIndex: 10
          }}>
            {bookInfo}
          </div>
        )}
      </div>

      {/* Contenu principal */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 24px'
      }}>
        {content ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            lineHeight: '1.8',
            fontSize: '16px'
          }}>
            <div 
              dangerouslySetInnerHTML={{ __html: formatVersetContent(content) }}
              style={{ color: '#374151' }}
            />
            
            {/* Styles CSS intégrés pour les couleurs */}
            <style>
              {`
                .verset-header {
                  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                  color: white;
                  font-size: 1.4rem;
                  font-weight: 800;
                  padding: 16px 24px;
                  border-radius: 12px;
                  margin: 32px 0 20px 0;
                  text-align: center;
                  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
                  text-transform: uppercase;
                  letter-spacing: 1px;
                }
                
                .texte-biblique-label {
                  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                  color: white;
                  font-size: 1.1rem;
                  font-weight: 700;
                  padding: 12px 20px;
                  border-radius: 10px;
                  margin: 24px 0 16px 0;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                .explication-label {
                  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                  color: white;
                  font-size: 1.1rem;
                  font-weight: 700;
                  padding: 12px 20px;
                  border-radius: 10px;
                  margin: 24px 0 16px 0;
                  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
                
                .verset-content p {
                  margin-bottom: 18px;
                  line-height: 1.8;
                }
                
                .verset-content br {
                  line-height: 1.8;
                }
                
                /* Responsive mobile */
                @media (max-width: 768px) {
                  .verset-header {
                    font-size: 1.2rem;
                    padding: 12px 16px;
                  }
                  
                  .texte-biblique-label,
                  .explication-label {
                    font-size: 1rem;
                    padding: 10px 16px;
                  }
                }
              `}
            </style>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px'
            }}>📖</div>
            <h2 style={{
              fontSize: '2rem',
              color: '#1f2937',
              marginBottom: '16px',
              fontWeight: '700'
            }}>
              Prêt pour l'Étude Verset par Verset
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '1.1rem',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              Sélectionnez un passage biblique depuis la page principale pour commencer une étude approfondie verset par verset avec explications théologiques.
            </p>
            <div style={{
              marginTop: '30px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              maxWidth: '600px',
              margin: '30px auto 0'
            }}>
              <div style={{
                padding: '20px',
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '12px',
                border: '2px solid rgba(139, 92, 246, 0.1)'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔵</div>
                <div style={{ color: '#475569', fontWeight: '600', fontSize: '14px' }}>
                  Versets en Violet
                </div>
              </div>
              <div style={{
                padding: '20px',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '12px',
                border: '2px solid rgba(59, 130, 246, 0.1)'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📘</div>
                <div style={{ color: '#475569', fontWeight: '600', fontSize: '14px' }}>
                  Textes en Bleu
                </div>
              </div>
              <div style={{
                padding: '20px',
                background: 'rgba(249, 115, 22, 0.05)',
                borderRadius: '12px',
                border: '2px solid rgba(249, 115, 22, 0.1)'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🧡</div>
                <div style={{ color: '#475569', fontWeight: '600', fontSize: '14px' }}>
                  Explications en Orange
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersetParVersetPage;