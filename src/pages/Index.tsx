
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import ChannelSetup from '@/components/ChannelSetup';
import Dashboard from '@/components/Dashboard';
import ConversationCapture from '@/components/ConversationCapture';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session?.user && !loading) {
          // Redirect to auth page if not authenticated
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, loading]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-main">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-main">Configuration Norbert</h1>
            <p className="text-sm text-main opacity-70">Connecté en tant que: {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSkipToN8N}
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              🔧 Accéder à N8N Webhook
            </Button>
            <Button 
              onClick={() => supabase.auth.signOut()}
              variant="outline"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
        
        <ChannelSetup onComplete={handleSetupComplete} />
        <Toaster />
        
        <ConversationCapture 
          userMessage={`Utilisateur ${user.email} sur la page de configuration`}
          aiResponse="Page de configuration des canaux affichée"
          context="channel-setup"
        />
      </div>
    </div>
  );
};

export default Index;
