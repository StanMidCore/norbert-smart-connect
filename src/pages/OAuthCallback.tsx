
import { useEffect } from 'react';

const OAuthCallback = () => {
  useEffect(() => {
    // Extraire les paramètres de l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const connection = urlParams.get('connection');
    const provider = urlParams.get('provider');
    
    console.log('📡 Callback OAuth reçu:', { connection, provider });
    
    // Communiquer le résultat à la fenêtre parent et fermer cette popup
    if (window.opener) {
      const message = {
        type: 'oauth-callback',
        connection,
        provider,
        success: connection === 'success'
      };
      
      console.log('📤 Envoi du message à la fenêtre parent:', message);
      window.opener.postMessage(message, '*');
      
      // Attendre un peu avant de fermer pour s'assurer que le message est reçu
      setTimeout(() => {
        console.log('🔒 Fermeture automatique de la popup');
        window.close();
      }, 1000);
      
    } else {
      // Fallback si pas de fenêtre parent (redirection directe)
      console.log('🔄 Pas de fenêtre parent, redirection vers l\'accueil');
      window.location.href = `/?connection=${connection}&provider=${provider}`;
    }

    // Ajouter un écouteur pour détecter si l'utilisateur ferme manuellement
    const handleBeforeUnload = () => {
      if (window.opener) {
        console.log('🔒 Fermeture manuelle détectée');
        // Envoyer un message pour indiquer la fermeture manuelle
        window.opener.postMessage({
          type: 'oauth-manual-close',
          provider
        }, '*');
      }
    };

    // Ajouter un écouteur pour le clic sur le bouton "Close" de Google
    const handleVisibilityChange = () => {
      if (document.hidden && window.opener) {
        console.log('👁️ Page masquée, possiblement fermée par l\'utilisateur');
        setTimeout(() => {
          if (window.opener && !window.closed) {
            window.opener.postMessage({
              type: 'oauth-manual-close',
              provider
            }, '*');
          }
        }, 500);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main mx-auto mb-4"></div>
        <p className="text-main">Connexion en cours...</p>
        <p className="text-sm text-gray-600 mt-2">Cette fenêtre va se fermer automatiquement...</p>
        
        <button 
          onClick={() => window.close()} 
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Fermer manuellement
        </button>
      </div>
    </div>
  );
};

export default OAuthCallback;
