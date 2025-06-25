import { useState, useEffect } from 'react';
import SignupFlow from '@/components/SignupFlow';
import ChannelSetup from '@/components/ChannelSetup';
import ProfileSetup from '@/components/ProfileSetup';
import Dashboard from '@/components/Dashboard';
import ClientDetail from '@/components/ClientDetail';
import OAuthCallback from '@/pages/OAuthCallback';

type AppScreen = 'signup' | 'channels' | 'profile' | 'dashboard' | 'calendar' | 'clients' | 'settings' | 'client-detail' | 'oauth-callback';

const Index = () => {
  // Changer l'écran par défaut vers 'channels' pour les tests
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('signup');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [hasCheckedUrlParams, setHasCheckedUrlParams] = useState(false);
  
  // Vérifier les paramètres URL au chargement - une seule fois
  useEffect(() => {
    if (hasCheckedUrlParams) return;
    
    console.log('🔍 Vérification des paramètres URL...');
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const paymentError = urlParams.get('payment_error');
    const connection = urlParams.get('connection');
    
    console.log('📋 Paramètres détectés:', { paymentSuccess, paymentError, connection });
    
    // Vérifier si c'est un callback OAuth
    if (connection && (window.location.pathname === '/oauth-callback' || connection === 'success' || connection === 'failed')) {
      console.log('🔗 Callback OAuth détecté, affichage de la page callback');
      setCurrentScreen('oauth-callback');
      setHasCheckedUrlParams(true);
      return;
    }
    
    if (paymentSuccess === 'true') {
      console.log('🎉 Paiement réussi détecté dans l\'URL, redirection vers canaux');
      setCurrentScreen('channels');
      // Nettoyer l'URL après un court délai pour permettre le chargement
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    } else if (paymentError === 'true') {
      console.log('❌ Erreur de paiement détectée dans l\'URL');
      setCurrentScreen('signup');
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    } else {
      console.log('ℹ️ Aucun paramètre de paiement détecté, écran par défaut');
    }
    
    setHasCheckedUrlParams(true);
  }, [hasCheckedUrlParams]);
  
  const handleChannelSetupComplete = () => {
    console.log('🔗 Configuration des canaux terminée, redirection vers profil');
    setCurrentScreen('profile');
  };
  
  const handleProfileSetupComplete = () => {
    console.log('👤 Configuration du profil terminée, redirection vers dashboard');
    setCurrentScreen('dashboard');
  };
  
  const handleNavigation = (screen: string) => {
    console.log('🧭 Navigation vers:', screen);
    setCurrentScreen(screen as AppScreen);
  };

  const handleClientDetail = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentScreen('client-detail');
  };

  const handleBackToDashboard = () => {
    setSelectedClientId(null);
    setCurrentScreen('dashboard');
  };

  const handleChannelSetup = () => {
    console.log('🔗 Redirection vers la configuration des canaux');
    setCurrentScreen('channels');
  };

  // Écran callback OAuth
  if (currentScreen === 'oauth-callback') {
    return <OAuthCallback />;
  }

  // Écran d'inscription
  if (currentScreen === 'signup') {
    return (
      <div>
        {/* Bouton de test pour aller directement aux canaux */}
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => setCurrentScreen('channels')}
            className="text-sm text-green-600 underline bg-white px-2 py-1 rounded shadow"
          >
            Test → Canaux
          </button>
        </div>
        <SignupFlow 
          onComplete={() => setCurrentScreen('dashboard')}
          onChannelSetup={handleChannelSetup}
          onProfileSetup={() => setCurrentScreen('profile')}
        />
      </div>
    );
  }
  
  // Écran configuration canaux
  if (currentScreen === 'channels') {
    console.log('🔗 Affichage de l\'écran de configuration des canaux');
    return (
      <div>
        {/* Boutons de navigation pour déboguer */}
        <div className="fixed top-4 left-4 z-50 space-x-2">
          <button 
            onClick={() => setCurrentScreen('signup')}
            className="text-sm text-blue-600 underline bg-white px-2 py-1 rounded shadow"
          >
            ← Inscription
          </button>
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="text-sm text-purple-600 underline bg-white px-2 py-1 rounded shadow"
          >
            Dashboard →
          </button>
        </div>
        <ChannelSetup onComplete={handleChannelSetupComplete} />
      </div>
    );
  }
  
  // Écran configuration profil
  if (currentScreen === 'profile') {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  // Écran détail client
  if (currentScreen === 'client-detail' && selectedClientId) {
    return (
      <ClientDetail 
        clientId={selectedClientId} 
        onBack={handleBackToDashboard}
      />
    );
  }
  
  // Écran principal dashboard
  if (currentScreen === 'dashboard') {
    return (
      <Dashboard 
        onNavigate={handleNavigation} 
        onClientDetail={handleClientDetail}
      />
    );
  }
  
  // Écrans temporaires pour la navigation
  if (currentScreen === 'calendar') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Calendrier</h1>
          <p className="text-gray-600 mb-8">Gestion des rendez-vous (à venir)</p>
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="text-blue-600 underline"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (currentScreen === 'clients') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Clients</h1>
          <p className="text-gray-600 mb-8">Liste des clients (à venir)</p>
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="text-blue-600 underline"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (currentScreen === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-bold mb-4 text-center">Réglages</h1>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Workflow Automatique</h2>
            <p className="text-gray-600 mb-4">Votre workflow N8N a été configuré automatiquement lors de l'activation. Il traite vos messages en temps réel.</p>
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="text-green-700 text-sm">✓ Workflow actif et opérationnel</p>
            </div>
          </div>
          
          <button 
            onClick={() => setCurrentScreen('dashboard')}
            className="text-blue-600 underline block mx-auto"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <SignupFlow 
      onComplete={() => setCurrentScreen('dashboard')}
      onChannelSetup={handleChannelSetup}
      onProfileSetup={() => setCurrentScreen('profile')}
    />
  );
};

export default Index;
