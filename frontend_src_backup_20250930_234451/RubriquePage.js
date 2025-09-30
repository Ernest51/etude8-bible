import React from 'react';

const RubriquePage = ({ onGoBack, rubriqueNumber, rubriqueTitle, content, bookInfo, onNavigateToRubrique }) => {
  
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
            fontWeight: '500',
            marginBottom: '10px'
          }}>
            {rubriqueTitle}
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
        {content ? (
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
            }}>📋</div>
            <h2 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              color: '#1f2937',
              marginBottom: '16px',
              fontWeight: '700'
            }}>
              Rubrique {rubriqueNumber}: {rubriqueTitle}
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: 'clamp(1rem, 3vw, 1.1rem)',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Le contenu de cette rubrique sera généré automatiquement selon votre sélection biblique.
            </p>
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
    </div>
  );
};

export default RubriquePage;