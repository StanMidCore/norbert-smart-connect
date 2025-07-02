
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import ChannelSetup from '@/components/ChannelSetup';
import Dashboard from '@/components/Dashboard';
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

  if (isSetupComplete) {
    return <Dashboard />;
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
      </div>
    </div>
  );
};

export default Index;
