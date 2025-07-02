
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import ChannelSetup from '@/components/ChannelSetup';
import Dashboard from '@/components/Dashboard';
import ConversationCapture from '@/components/ConversationCapture';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const navigate = useNavigate();

  const handleSetupComplete = () => {
    setIsSetupComplete(true);
  };

  const handleSkipToN8N = () => {
    navigate('/n8n-webhook');
  };

  const handleNavigate = (screen: string) => {
    console.log('Navigation vers:', screen);
    // TODO: Implémenter la navigation entre les écrans du dashboard
  };

  const handleClientDetail = (clientId: string) => {
    console.log('Détail client:', clientId);
    // TODO: Implémenter l'affichage du détail client
  };

  if (isSetupComplete) {
    return (
      <>
        <Dashboard onNavigate={handleNavigate} onClientDetail={handleClientDetail} />
        <ConversationCapture 
          userMessage="Utilisateur a navigué vers le dashboard"
          aiResponse="Dashboard affiché avec succès"
          context="dashboard-navigation"
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Configuration Norbert</h1>
          <Button 
            onClick={handleSkipToN8N}
            variant="outline"
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            🔧 Accéder à N8N Webhook
          </Button>
        </div>
        
        <ChannelSetup onComplete={handleSetupComplete} />
        <Toaster />
        
        <ConversationCapture 
          userMessage="Utilisateur sur la page de configuration"
          aiResponse="Page de configuration des canaux affichée"
          context="channel-setup"
        />
      </div>
    </div>
  );
};

export default Index;
