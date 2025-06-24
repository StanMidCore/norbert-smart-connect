
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OAuthParametersHandlerProps {
  onConnectionSuccess: (provider: string) => void;
  onConnectionFailure: (provider: string) => void;
}

const OAuthParametersHandler = ({ onConnectionSuccess, onConnectionFailure }: OAuthParametersHandlerProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connection = urlParams.get('connection');
    const provider = urlParams.get('provider');
    
    if (connection === 'success' && provider) {
      console.log(`✅ Connexion ${provider} réussie via URL`);
      toast({
        title: "Connexion réussie",
        description: `Votre compte ${provider} a été connecté avec succès`,
      });
      window.history.replaceState({}, '', window.location.pathname);
      onConnectionSuccess(provider);
    } else if (connection === 'failed' && provider) {
      console.log(`❌ Connexion ${provider} échouée via URL`);
      toast({
        title: "Échec de la connexion",
        description: `Impossible de connecter votre compte ${provider}`,
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
      onConnectionFailure(provider);
    }
  }, [toast, onConnectionSuccess, onConnectionFailure]);

  return null;
};

export default OAuthParametersHandler;
