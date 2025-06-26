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
  
  // Vérifier les paramètres URL au chargement avec une approche plus robuste
  useEffect(() => {
    console.log('🔍 Vérification des paramètres URL au chargement...');
    
    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      const paymentError = urlParams.get('payment_error');
      const redirectTo = urlParams.get('redirect');
      const connection = urlParams.get('connection');
      const email = urlParams.get('email');
      const signupComplete = urlParams.get('signup_complete');
      
      console.log('📋 Paramètres URL détectés:', { 
        paymentSuccess, 
        paymentError, 
        redirectTo, 
        connection, 
        email,
        signupComplete,
        fullUrl: window.location.href 
      });
      
      // Gérer les callbacks OAuth en priorité
      if (connection && (window.location.pathname === '/oauth-callback' || connection === 'success' || connection === 'failed')) {
        console.log('🔗 Callback OAuth détecté');
        setCurrentScreen('oauth-callback');
        return true;
      }
      
      // Gérer la redirection après paiement réussi
      if (paymentSuccess === 'true' || (signupComplete === 'true' && redirectTo === 'channels')) {
        console.log('🎉 Paiement réussi détecté - redirection vers canaux');
        setCurrentScreen('channels');
        
        // Nettoyer l'URL après redirection
        setTimeout(() => {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          console.log('🧹 URL nettoyée après redirection vers canaux');
        }, 1000);
        return true;
      }
      
      // Gérer les erreurs de paiement
      if (paymentError === 'true') {
        console.log('❌ Erreur de paiement détectée');
        const errorDetails = urlParams.get('error_details');
        if (errorDetails) {
          console.error('Détails erreur paiement:', decodeURIComponent(errorDetails));
        }
        setCurrentScreen('signup');
        
        // Nettoyer l'URL
        setTimeout(() => {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }, 1000);
        return true;
      }
      
      // Redirection explicite vers les canaux
      if (redirectTo === 'channels') {
        console.log('🔗 Redirection explicite vers canaux');
        setCurrentScreen('channels');
        
        setTimeout(() => {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }, 1000);
        return true;
      }
      
      console.log('ℹ️ Aucun paramètre de redirection spécial, écran par défaut');
      return false;
    };
    
    // Vérifier immédiatement
    const hasRedirected = checkUrlParams();
    
    // Si aucune redirection immédiate, vérifier après un délai pour les redirections asynchrones
    if (!hasRedirected) {
      const timeoutId = setTimeout(() => {
        checkUrlParams();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, []);
  
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
        <div className="fixed top-4 right-4 z-50 space-x-2">
          <button 
            onClick={() => setCurrentScreen('channels')}
            className="text-sm text-green-600 underline bg-white px-2 py-1 rounded shadow"
          >
            Test → Canaux
          </button>
          <button 
            onClick={() => window.location.href = '/?payment_success=true&redirect=channels&signup_complete=true'}
            className="text-sm text-blue-600 underline bg-white px-2 py-1 rounded shadow"
          >
            Test Redirection
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
