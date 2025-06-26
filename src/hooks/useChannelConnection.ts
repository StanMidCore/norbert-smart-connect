
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
      console.log(`🔌 Tentative de connexion ${provider}...`);
      const result = await connectAccount(provider);
      
      console.log(`📄 Réponse reçue pour ${provider}:`, result);
      
      if (result.qr_code) {
        // Pour WhatsApp, afficher le QR code
        console.log('📱 QR Code WhatsApp reçu, longueur:', result.qr_code.length);
        setQrCode(result.qr_code);
        setConnecting(null);
        toast({
          title: "QR Code généré",
          description: "Scannez le QR code avec WhatsApp pour connecter votre compte",
        });
      } else if (result.requires_sms) {
        // Alternative WhatsApp par SMS
        setConnecting(null);
        toast({
          title: "Connexion WhatsApp",
          description: "Connexion par SMS disponible - cette fonctionnalité sera ajoutée prochainement",
        });
      } else if (result.authorization_url) {
        // Pour OAuth, utiliser le gestionnaire de fenêtre
        console.log('🔗 URL d\'autorisation reçue pour', provider);
        
        // Ajouter un délai pour éviter le blocage immédiat
        setTimeout(() => {
          const handleComplete = async () => {
            console.log(`🔄 Actualisation après OAuth ${provider}`);
            setConnecting(null);
            
            // Actualisation avec plusieurs tentatives et délais progressifs
            const maxRetries = 5;
            let attempt = 0;
            
            const tryRefresh = async () => {
              attempt++;
              console.log(`🔄 Tentative d'actualisation ${attempt}/${maxRetries} pour ${provider}`);
              
              // Délai progressif : 2s, 4s, 6s, 8s, 10s
              const delay = attempt * 2000;
              
              setTimeout(async () => {
                onConnectionComplete();
                
                // Si ce n'est pas la dernière tentative, programmer la suivante
                if (attempt < maxRetries) {
                  tryRefresh();
                }
              }, delay);
            };
            
            // Commencer les tentatives d'actualisation
            tryRefresh();
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
        // Actualisation immédiate après succès
        setTimeout(() => {
          onConnectionComplete();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      setConnecting(null);
      
      let errorMessage = `Impossible de connecter ${provider}. `;
      
      if (error.message?.includes('Invalid credentials') || error.message?.includes('Configuration manquante')) {
        errorMessage += 'Clé API Unipile invalide ou manquante. Veuillez vérifier votre configuration.';
      } else if (error.message?.includes('non-2xx status code')) {
        errorMessage += 'Erreur de configuration du serveur. Veuillez réessayer plus tard.';
      } else {
        errorMessage += `Détails: ${error.message || 'Veuillez réessayer.'}`;
      }
      
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [connectAccount, toast, openAuthWindow, onConnectionComplete]);

  const handleQRError = useCallback((message: string) => {
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
