
import { useState } from 'react';
import ActivationScreen from '@/components/ActivationScreen';
import ChannelSetup from '@/components/ChannelSetup';
import ProfileSetup from '@/components/ProfileSetup';
import Dashboard from '@/components/Dashboard';

type AppScreen = 'activation' | 'channels' | 'profile' | 'dashboard' | 'calendar' | 'clients' | 'settings';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('activation');
  
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
  
  // Écran principal et navigation
  if (currentScreen === 'dashboard') {
    return <Dashboard onNavigate={handleNavigation} />;
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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Réglages</h1>
          <p className="text-gray-600 mb-8">Configuration (à venir)</p>
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

  return <Dashboard onNavigate={handleNavigation} />;
};

export default Index;
