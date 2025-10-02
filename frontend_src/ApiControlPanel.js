import React, { useState, useEffect } from 'react';

const ApiControlPanel = ({ backendUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [apiHistory, setApiHistory] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fonction pour récupérer le statut des API
  const fetchApiStatus = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/api-status`);
      if (response.ok) {
        const status = await response.json();
        setApiStatus(status);
        setLastUpdate(new Date().toLocaleTimeString());
        console.log('[API STATUS] Mise à jour:', status);
      }
    } catch (error) {
      console.error('[API STATUS] Erreur:', error);
    }
  };

  // Fonction pour récupérer l'historique des API
  const fetchApiHistory = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/api-history`);
      if (response.ok) {
        const history = await response.json();
        setApiHistory(history);
        console.log('[API HISTORY] Historique récupéré:', history);
      }
    } catch (error) {
      console.error('[API HISTORY] Erreur:', error);
    }
  };

  // Mise à jour toutes les 30 secondes
  useEffect(() => {
    // Première récupération
    fetchApiStatus();
    fetchApiHistory();
    
    // Mise à jour automatique toutes les 30 secondes
    const interval = setInterval(() => {
      fetchApiStatus();
      fetchApiHistory();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [backendUrl]);

  // Fonction pour obtenir la couleur LED
  const getLedColor = (apiInfo) => {
    return apiInfo?.color === 'green' ? '#00ff00' : '#ff0000';
  };

  // Fonction pour obtenir l'icône de statut
  const getStatusIcon = (apiInfo) => {
    return apiInfo?.color === 'green' ? '✅' : '❌';
  };

  // Style pour les LED clignotantes (amélioré)
  const ledStyle = (color) => ({
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: color,
    boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
    animation: color === '#00ff00' ? 'pulse-green 2s infinite' : 'pulse-red 1s infinite',
    display: 'inline-block',
    marginRight: '8px',
    border: '2px solid rgba(255,255,255,0.3)'
  });

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* CSS pour les animations LED améliorées */}
      <style>
        {`
          @keyframes pulse-green {
            0%, 100% { 
              box-shadow: 0 0 12px #00ff00, 0 0 24px #00ff00; 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              box-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00; 
              opacity: 0.8; 
              transform: scale(1.1);
            }
          }
          @keyframes pulse-red {
            0%, 100% { 
              box-shadow: 0 0 12px #ff0000, 0 0 24px #ff0000; 
              opacity: 1; 
              transform: scale(1);
            }
            50% { 
              box-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000; 
              opacity: 0.4; 
              transform: scale(1.2);
            }
          }
          .api-control-tooltip {
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 6px 12px;
            borderRadius: 8px;
            fontSize: 11px;
            whiteSpace: nowrap;
            zIndex: 1001;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .api-control-tooltip.visible {
            opacity: 1;
          }
          @keyframes scroll-up {
            0%, 70% { transform: translateY(0); }
            85%, 100% { transform: translateY(-100%); }
          }
          .api-elevator {
            height: 18px;
            overflow: hidden;
            position: relative;
            background: rgba(255,255,255,0.15);
            borderRadius: 6px;
            padding: 0 8px;
            minWidth: 75px;
            zIndex: 2;
          }
          @keyframes api-ticker {
            0%, 30% { transform: translateY(0); }
            33%, 63% { transform: translateY(-18px); }
            66%, 96% { transform: translateY(-36px); }
            100% { transform: translateY(0); }
          }
          @keyframes shine {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}
      </style>

      {/* Bouton de contrôle harmonisé avec GÉNÉRER */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          // Même style que btn-generate
          background: 'linear-gradient(135deg, #3742fa, #2f3542)',
          border: 'none',
          borderRadius: '14px',
          color: 'white',
          padding: '16px 24px',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginLeft: '10px',
          minWidth: '140px',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-4px) scale(1.02)';
          e.target.style.boxShadow = '0 10px 30px rgba(55,66,250,0.4)';
          setShowTooltip(true);
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0) scale(1)';
          e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
          setShowTooltip(false);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚙️ API</span>
          
          {/* Indicateur de statut global plus visible */}
          {apiStatus && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.2)',
              padding: '4px 8px',
              borderRadius: '8px'
            }}>
              {/* Statut global */}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: Object.values(apiStatus.apis).every(api => api.color === 'green') ? '#00ff00' : '#ff0000',
                boxShadow: `0 0 8px ${Object.values(apiStatus.apis).every(api => api.color === 'green') ? '#00ff00' : '#ff0000'}`,
                animation: Object.values(apiStatus.apis).every(api => api.color === 'green') ? 'pulse-green 2s infinite' : 'pulse-red 1s infinite'
              }} />
              
              {/* Ascenseur API avec rotation des noms */}
              <div className="api-elevator">
                <div style={{
                  fontSize: '9px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  animation: 'api-ticker 6s infinite',
                  lineHeight: '18px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {Object.entries(apiStatus.apis).map(([key, api]) => (
                    <div 
                      key={key}
                      style={{ 
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        color: key === apiStatus.active_api ? '#fff' : 'rgba(255,255,255,0.7)'
                      }}
                    >
                      <span style={{ 
                        color: api.color === 'green' ? '#00ff00' : '#ff0000',
                        marginRight: '2px' 
                      }}>
                        {api.color === 'green' ? '●' : '●'}
                      </span>
                      {api.name.replace('Gemini Key ', 'G').replace(' (Primary)', '').replace(' (Secondary)', '').replace('Bible API', 'Bible')}
                      <span style={{ marginLeft: '2px', fontSize: '8px' }}>
                        {api.color === 'green' ? 'OK' : 'ERR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* LED individuelles plus grandes */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {Object.entries(apiStatus.apis).map(([key, api]) => (
                  <div 
                    key={key}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: getLedColor(api),
                      boxShadow: `0 0 6px ${getLedColor(api)}`,
                      animation: api.color === 'green' ? 'pulse-green 2s infinite' : 'pulse-red 1s infinite'
                    }}
                    title={`${api.name}: ${api.status === 'available' ? 'Disponible' : 'Quota dépassé'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Effet de brillance comme sur btn-generate */}
        <div style={{
          content: '',
          position: 'absolute',
          top: '0',
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          animation: 'shine 3s infinite',
          zIndex: 1
        }} />
        
        {/* Tooltip améliorée */}
        {showTooltip && apiStatus && (
          <div className={`api-control-tooltip ${showTooltip ? 'visible' : ''}`}>
            {Object.values(apiStatus.apis).every(api => api.color === 'green') 
              ? '🟢 Toutes les API sont opérationnelles' 
              : '🔴 Certaines API ont des problèmes'
            }
          </div>
        )}
      </button>

      {/* Panneau de contrôle */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '10px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '20px',
          minWidth: '350px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          {/* En-tête */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            paddingBottom: '12px'
          }}>
            <h3 style={{
              margin: 0,
              color: '#333',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              🔧 Statut des API
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#999'
              }}
            >
              ✕
            </button>
          </div>

          {/* Liste des API */}
          {apiStatus ? (
            <div style={{ marginBottom: '16px' }}>
              {Object.entries(apiStatus.apis).map(([key, api]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    marginBottom: '8px',
                    background: api.color === 'green' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                    border: `1px solid ${api.color === 'green' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'}`,
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={ledStyle(getLedColor(api))} />
                      <span style={{
                        fontWeight: 'bold',
                        color: '#333',
                        marginRight: '8px'
                      }}>
                        {api.name}
                      </span>
                      {key === apiStatus.active_api && (
                        <span style={{
                          background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginLeft: '20px' }}>
                      ✅ {api.success_count} succès | ❌ {api.error_count} échecs
                      {api.last_used && (
                        <div>Dernière utilisation: {new Date(api.last_used).toLocaleTimeString()}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '12px',
                      color: api.color === 'green' ? '#4CAF50' : '#f44336',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {api.status === 'available' ? 'Disponible' : 'Quota Dépassé'}
                    </span>
                    <span style={{ fontSize: '16px', marginLeft: '8px' }}>
                      {getStatusIcon(api)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#666'
            }}>
              📡 Chargement du statut...
            </div>
          )}

          {/* Bouton pour afficher l'historique */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '12px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            📊 {showHistory ? 'Masquer' : 'Afficher'} l'Historique
          </button>

          {/* Historique détaillé */}
          {showHistory && apiHistory && (
            <div style={{
              marginBottom: '16px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '8px',
              background: 'rgba(0,0,0,0.02)'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                📋 Derniers appels API ({apiHistory.total_calls} total)
              </h4>
              {apiHistory.history.slice().reverse().map((call, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px',
                    marginBottom: '4px',
                    background: call.success ? 'rgba(0, 255, 0, 0.05)' : 'rgba(255, 0, 0, 0.05)',
                    border: `1px solid ${call.success ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)'}`,
                    borderRadius: '4px',
                    fontSize: '10px'
                  }}
                >
                  <div>
                    <strong>{call.api_name}</strong>
                    <div style={{ color: '#666' }}>
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: call.success ? '#4CAF50' : '#f44336' }}>
                      {call.success ? '✅ SUCCESS' : '❌ ERROR'}
                    </div>
                    <div style={{ color: '#666' }}>
                      {call.content_length > 0 ? `${call.content_length} chars` : call.error}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informations de mise à jour */}
          <div style={{
            fontSize: '11px',
            color: '#666',
            textAlign: 'center',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            paddingTop: '12px'
          }}>
            🔄 Mise à jour automatique toutes les 30s
            {lastUpdate && (
              <div>Dernière mise à jour: {lastUpdate}</div>
            )}
          </div>

          {/* Légende */}
          <div style={{
            fontSize: '10px',
            color: '#888',
            marginTop: '12px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>🟢 Disponible</span>
            <span>🔴 Quota dépassé</span>
            <span>⚡ Rotation automatique</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiControlPanel;