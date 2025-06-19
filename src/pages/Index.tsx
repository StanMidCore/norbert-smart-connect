import { useState } from 'react';
import ActivationScreen from '@/components/ActivationScreen';
import ChannelSetup from '@/components/ChannelSetup';
import ProfileSetup from '@/components/ProfileSetup';
import Dashboard from '@/components/Dashboard';
import ClientDetail from '@/components/ClientDetail';
import N8NWorkflowDownload from '@/components/N8NWorkflowDownload';

type AppScreen = 'activation' | 'channels' | 'profile' | 'dashboard' | 'calendar' | 'clients' | 'settings' | 'client-detail' | 'n8n-download';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('activation');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  const handleActivationSuccess = () => {
    setCurrentScreen('channels');
  };
  
  const handleChannelSetupComplete = () => {
    setCurrentScreen('profile');
  };
  
  const handleProfileSetupComplete = () => {
    setCurrentScreen('dashboard');
  };
  
  const handleNavigation = (screen: string) => {
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

  // Écrans de configuration
  if (currentScreen === 'activation') {
    return <ActivationScreen onActivationSuccess={handleActivationSuccess} />;
  }
  
  if (currentScreen === 'channels') {
    return <ChannelSetup onComplete={handleChannelSetupComplete} />;
  }
  
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
  
  // Écran principal et navigation
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
            <h2 className="text-lg font-semibold mb-2">Workflow N8N</h2>
            <p className="text-gray-600 mb-4">Téléchargez le workflow Norbert IA pour votre instance N8N</p>
            <button 
              onClick={() => setCurrentScreen('n8n-download')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Télécharger le workflow
            </button>
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

  if (currentScreen === 'n8n-download') {
    return <N8NWorkflowDownload />;
  }

  return <Dashboard onNavigate={handleNavigation} onClientDetail={handleClientDetail} />;
};

export default Index;
