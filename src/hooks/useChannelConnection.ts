
import { useState, useCallback } from 'react';
import { useUnipile } from '@/hooks/useUnipile';
import { useToast } from '@/hooks/use-toast';
import { useOAuthWindow } from './useOAuthWindow';

export const useChannelConnection = (onConnectionComplete: () => void) => {
  const { connectAccount } = useUnipile();
  const { toast } = useToast();
  const { openAuthWindow } = useOAuthWindow();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleConnectProvider = useCallback(async (provider: string, user: any) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Utilisateur non trouvé. Veuillez recharger la page.",
        variant: "destructive",
      });
      return;
    }

    setConnecting(provider);
    setQrCode(null);
    
    try {
      console.log(`🔌 DEBUG: Tentative de connexion ${provider}...`);
      console.log('🔌 DEBUG: User:', user);
      console.log('🔌 DEBUG: Provider:', provider);
      
      const result = await connectAccount(provider);
      
      console.log(`📄 DEBUG: Réponse complète pour ${provider}:`, result);
      
      if (result.qr_code) {
        console.log('📱 DEBUG: QR Code WhatsApp reçu, longueur:', result.qr_code.length);
        setQrCode(result.qr_code);
        setConnecting(null);
        toast({
          title: "QR Code généré",
          description: "Scannez le QR code avec WhatsApp pour connecter votre compte",
        });
      } else if (result.requires_sms) {
        setConnecting(null);
        toast({
          title: "Connexion WhatsApp",
          description: "Connexion par SMS disponible - cette fonctionnalité sera ajoutée prochainement",
        });
      } else if (result.authorization_url) {
        console.log('🔗 DEBUG: URL d\'autorisation reçue pour', provider);
        console.log('🔗 DEBUG: URL complète:', result.authorization_url);
        
        setTimeout(() => {
          const handleComplete = async () => {
            console.log(`✅ DEBUG: Connexion OAuth ${provider} réussie`);
            setConnecting(null);
            
            setTimeout(() => {
              onConnectionComplete();
            }, 2000);
          };

          const success = openAuthWindow(result.authorization_url, provider, handleComplete, toast);
          
          if (success) {
            toast({
              title: "Autorisation en cours",
              description: `Autorisez l'accès à ${provider} dans la nouvelle fenêtre.`,
            });
          } else {
            setConnecting(null);
            toast({
              title: "Erreur d'autorisation",
              description: 'Impossible d\'ouvrir la fenêtre d\'autorisation. Vérifiez que les popups ne sont pas bloquées.',
              variant: "destructive",
            });
          }
        }, 200);
      } else if (result.requires_manual_setup) {
        setConnecting(null);
        toast({
          title: "Configuration manuelle requise",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setConnecting(null);
        toast({
          title: "Connexion réussie",
          description: `Votre compte ${provider} a été connecté`,
        });
        setTimeout(() => {
          onConnectionComplete();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ DEBUG: Erreur connexion complète:', error);
      console.error('❌ DEBUG: Type erreur:', typeof error);
      console.error('❌ DEBUG: Message:', error.message);
      console.error('❌ DEBUG: Stack:', error.stack);
      
      setConnecting(null);
      
      let errorMessage = `Impossible de connecter ${provider}. `;
      
      if (error.message?.includes('Invalid credentials') || error.message?.includes('Configuration manquante')) {
        errorMessage += 'Clé API Unipile invalide ou manquante. Veuillez vérifier votre configuration.';
      } else if (error.message?.includes('non-2xx status code')) {
        errorMessage += 'Erreur de configuration du serveur. Veuillez réessayer plus tard.';
      } else {
        errorMessage += `Détails: ${error.message || 'Veuillez réessayer.'}`;
      }
      
      // Ajout d'informations de debug pour l'utilisateur
      console.log('🔍 DEBUG: Informations complètes de l\'erreur pour diagnostic:', {
        provider,
        user: user?.email,
        errorType: typeof error,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [connectAccount, toast, openAuthWindow, onConnectionComplete]);

  const handleQRError = useCallback((message: string) => {
    console.error('❌ DEBUG: Erreur QR Code:', message);
    toast({
      title: "Erreur QR Code",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  return {
    connecting,
    qrCode,
    setQrCode,
    handleConnectProvider,
    handleQRError
  };
};
