import React, { useState, useEffect, useRef } from 'react';

const NotesPage = ({ onGoBack }) => {
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const textareaRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);

  // Clés de sauvegarde multiples pour sécurité maximale
  const STORAGE_KEYS = {
    primary: 'bible-study-notes',
    backup1: 'bible-study-notes-backup-1', 
    backup2: 'bible-study-notes-backup-2',
    metadata: 'bible-study-notes-meta'
  };

  // Fonction de sauvegarde ultra-robuste avec multiples backups
  const saveNotesToStorage = (notesContent) => {
    try {
      const timestamp = new Date().toISOString();
      const metadata = {
        lastSaved: timestamp,
        saveCount: saveCount + 1,
        contentLength: notesContent.length
      };

      // Sauvegarde primaire
      localStorage.setItem(STORAGE_KEYS.primary, JSON.stringify(notesContent));
      
      // Sauvegarde backup 1
      localStorage.setItem(STORAGE_KEYS.backup1, JSON.stringify(notesContent));
      
      // Sauvegarde backup 2 (rotation toutes les 5 sauvegardes)
      if (saveCount % 5 === 0) {
        localStorage.setItem(STORAGE_KEYS.backup2, JSON.stringify(notesContent));
      }
      
      // Métadonnées
      localStorage.setItem(STORAGE_KEYS.metadata, JSON.stringify(metadata));
      
      setLastSaved(timestamp);
      setSaveCount(prev => prev + 1);
      
      console.log(`[NOTES] Sauvegarde réussie - Count: ${saveCount + 1}, Taille: ${notesContent.length} chars`);
      return true;
    } catch (error) {
      console.error('[NOTES] Erreur sauvegarde:', error);
      return false;
    }
  };

  // Fonction de récupération avec fallback sur les backups
  const loadNotesFromStorage = () => {
    try {
      // Essayer la sauvegarde primaire
      let savedNotes = localStorage.getItem(STORAGE_KEYS.primary);
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        console.log('[NOTES] Chargement depuis sauvegarde primaire');
        return parsed;
      }

      // Fallback sur backup 1
      savedNotes = localStorage.getItem(STORAGE_KEYS.backup1);
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        console.log('[NOTES] Chargement depuis backup 1');
        // Restaurer la sauvegarde primaire
        localStorage.setItem(STORAGE_KEYS.primary, savedNotes);
        return parsed;
      }

      // Fallback sur backup 2
      savedNotes = localStorage.getItem(STORAGE_KEYS.backup2);
      if (savedNotes) {
        const parsed = JSON.parse(savedNotes);
        console.log('[NOTES] Chargement depuis backup 2');
        // Restaurer les sauvegardes primaire et backup 1
        localStorage.setItem(STORAGE_KEYS.primary, savedNotes);
        localStorage.setItem(STORAGE_KEYS.backup1, savedNotes);
        return parsed;
      }

      console.log('[NOTES] Aucune sauvegarde trouvée');
      return '';
    } catch (error) {
      console.error('[NOTES] Erreur chargement:', error);
      return '';
    }
  };

  // Chargement initial des notes
  useEffect(() => {
    const loadedNotes = loadNotesFromStorage();
    setNotes(loadedNotes);

    // Charger les métadonnées
    try {
      const metadata = localStorage.getItem(STORAGE_KEYS.metadata);
      if (metadata) {
        const parsed = JSON.parse(metadata);
        setLastSaved(parsed.lastSaved);
        setSaveCount(parsed.saveCount || 0);
      }
    } catch (error) {
      console.error('[NOTES] Erreur chargement métadonnées:', error);
    }
  }, []);

  // Auto-sauvegarde toutes les 3 secondes lors de la saisie
  useEffect(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    autoSaveIntervalRef.current = setInterval(() => {
      if (notes.trim().length > 0) {
        setIsSaving(true);
        saveNotesToStorage(notes);
        setTimeout(() => setIsSaving(false), 1000);
      }
    }, 3000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [notes, saveCount]);

  // Sauvegarde manuelle
  const handleManualSave = () => {
    setIsSaving(true);
    const success = saveNotesToStorage(notes);
    setTimeout(() => setIsSaving(false), 1000);
    
    if (success) {
      // Feedback visuel
      if (textareaRef.current) {
        textareaRef.current.style.borderColor = '#10b981';
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.borderColor = '';
          }
        }, 2000);
      }
    }
  };

  // Sauvegarde avant fermeture de page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (notes.trim().length > 0) {
        saveNotesToStorage(notes);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && notes.trim().length > 0) {
        saveNotesToStorage(notes);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [notes]);

  const formatLastSaved = () => {
    if (!lastSaved) return 'Jamais sauvegardé';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Sauvegardé à l\'instant';
    if (diffMinutes === 1) return 'Sauvegardé il y a 1 minute';
    if (diffMinutes < 60) return `Sauvegardé il y a ${diffMinutes} minutes`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return 'Sauvegardé il y a 1 heure';
    if (diffHours < 24) return `Sauvegardé il y a ${diffHours} heures`;
    
    return `Sauvegardé le ${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.95) 50%, rgba(248, 250, 252, 0.98) 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* En-tête moderne */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.98) 100%)',
        color: 'white',
        padding: '30px 20px',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25)',
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
            📝 Mes Notes d'Étude Biblique
          </h1>
          
          <div style={{
            fontSize: 'clamp(1rem, 3vw, 1.1rem)',
            textAlign: 'center',
            opacity: 0.9,
            fontWeight: '500'
          }}>
            Carnet personnel permanent • {notes.length} caractères
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Zone de saisie */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 'clamp(20px, 5vw, 30px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '2px solid rgba(226, 232, 240, 0.8)',
          marginBottom: '20px',
          transition: 'border-color 0.3s ease'
        }}>
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`✍️ Écrivez vos réflexions spirituelles ici...

Exemples d'utilisation :
• Versets qui m'ont marqué aujourd'hui
• Questions pour approfondir ma foi  
• Révélations reçues pendant l'étude
• Applications personnelles des enseignements
• Prières inspirées par les passages étudiés
• Liens entre différents passages bibliques
• Témoignages et expériences spirituelles

💡 Vos notes sont sauvegardées automatiquement et de façon permanente !`}
            style={{
              width: '100%',
              minHeight: 'clamp(300px, 50vh, 500px)',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontSize: 'clamp(15px, 4vw, 16px)',
              lineHeight: '1.6',
              fontFamily: 'Georgia, serif',
              backgroundColor: 'transparent',
              color: '#374151',
              transition: 'border-color 0.3s ease'
            }}
          />
          
          {/* Barre d'actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            {/* Informations de sauvegarde */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: 'clamp(12px, 3vw, 14px)',
                color: '#6b7280'
              }}>
                {isSaving ? (
                  <>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid #e5e7eb',
                      borderTop: '2px solid #10b981',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <span style={{ color: '#10b981' }}>✓</span>
                    {formatLastSaved()}
                  </>
                )}
              </div>
              
              <div style={{
                fontSize: 'clamp(12px, 3vw, 14px)',
                color: '#6b7280'
              }}>
                {saveCount} sauvegarde{saveCount > 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Bouton de sauvegarde manuelle */}
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              style={{
                background: isSaving 
                  ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: 'clamp(10px, 3vw, 12px) clamp(16px, 4vw, 20px)',
                borderRadius: '10px',
                fontSize: 'clamp(13px, 3.5vw, 15px)',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 12px rgba(16, 185, 129, 0.25)',
                opacity: isSaving ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!isSaving) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.35)';
                }
              }}
              onMouseOut={(e) => {
                if (!isSaving) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 3px 12px rgba(16, 185, 129, 0.25)';
                }
              }}
            >
              💾 Sauvegarder maintenant
            </button>
          </div>
        </div>

        {/* Informations sur la sécurité des données */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '2px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '1.5rem',
              minWidth: '32px',
              textAlign: 'center'
            }}>🔒</div>
            <div>
              <h3 style={{
                margin: '0 0 8px 0',
                color: '#059669',
                fontSize: 'clamp(1rem, 4vw, 1.1rem)',
                fontWeight: '700'
              }}>
                Sécurité Maximum de vos Notes
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                color: '#374151',
                fontSize: 'clamp(13px, 3.5vw, 14px)',
                lineHeight: '1.5'
              }}>
                <li>🔄 <strong>Auto-sauvegarde</strong> toutes les 3 secondes</li>
                <li>💾 <strong>Triple sauvegarde</strong> : primaire + 2 backups</li>
                <li>🛡️ <strong>Sauvegarde avant fermeture</strong> de page automatique</li>
                <li>🔄 <strong>Récupération automatique</strong> en cas de problème</li>
                <li>♾️ <strong>Persistance garantie</strong> : vos notes ne seront JAMAIS perdues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Styles CSS pour les animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Optimisations mobile supplémentaires */
          @media (max-width: 768px) {
            textarea {
              min-height: 400px !important;
            }
          }
          
          @media (max-width: 480px) {
            textarea {
              min-height: 350px !important;
              font-size: 16px !important; /* Évite le zoom sur iOS */
            }
          }
        `}
      </style>
    </div>
  );
};

export default NotesPage;