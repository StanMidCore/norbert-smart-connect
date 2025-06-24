
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnipile } from '@/hooks/useUnipile';
import { useNorbertUser } from '@/hooks/useNorbertUser';
import { useToast } from '@/hooks/use-toast';
import type { Channel } from '@/types/norbert';
import { OAuthWindowManager } from '@/components/channel-setup/OAuthWindowManager';

export const useChannelSetup = () => {
  const { channels, loading, error, fetchAccounts, connectAccount } = useUnipile();
  const { user, getCurrentUser } = useNorbertUser();
  const { toast } = useToast();
  const [connectedChannels, setConnectedChannels] = useState<Channel[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const fetchingRef = useRef(false);
  const oauthManagerRef = useRef(new OAuthWindowManager());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser l'utilisateur au chargement
  useEffect(() => {
    if (!user && !hasInitialized) {
      console.log('🔄 Initialisation utilisateur...');
      getCurrentUser();
      setHasInitialized(true);
    }
  }, [user, getCurrentUser, hasInitialized]);

  // Récupérer les comptes au démarrage
  const fetchAccountsOnce = useCallback(async () => {
    if (user && !fetchingRef.current && !loading) {
      console.log('📡 RÉCUPÉRATION des comptes pour:', user.email);
      fetchingRef.current = true;
      
      try {
        await fetchAccounts();
        console.log('✅ Comptes récupérés avec succès');
      } catch (err) {
        console.error('❌ Erreur récupération comptes:', err);
      } finally {
        fetchingRef.current = false;
      }
    }
  }, [user, fetchAccounts, loading]);

  useEffect(() => {
    if (user) {
      fetchAccountsOnce();
    }
  }, [user, fetchAccountsOnce]);

  // Système de polling pour OAuth (Gmail, Outlook, Facebook)
  const startPollingForNewAccounts = useCallback((provider: string) => {
    console.log(`🔄 Démarrage polling pour ${provider}`);
    let pollCount = 0;
    const maxPolls = 20; // 20 tentatives sur 40 secondes
    
    const pollForAccounts = async () => {
      pollCount++;
      console.log(`🔍 Polling ${provider} - tentative ${pollCount}/${maxPolls}`);
      
      try {
        await fetchAccounts();
        
        // Vérifier si le nouveau compte est disponible
        const hasNewAccount = channels.some(ch => 
          ch.channel_type.toLowerCase() === provider.toLowerCase() && 
          ch.status === 'connected'
        );
        
        if (hasNewAccount) {
          console.log(`✅ Nouveau compte ${provider} détecté!`);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          
          toast({
            title: "Connexion réussie",
            description: `Votre compte ${provider} a été connecté avec succès`,
          });
          
          setConnecting(null);
          return;
        }
        
        // Arrêter le polling après le nombre max de tentatives
        if (pollCount >= maxPolls) {
          console.log(`⏰ Polling ${provider} terminé sans succès`);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setConnecting(null);
        }
      } catch (error) {
        console.error(`❌ Erreur polling ${provider}:`, error);
      }
    };
    
    // Démarrer le polling toutes les 2 secondes
    pollingIntervalRef.current = setInterval(pollForAccounts, 2000);
    
    // Première vérification immédiate
    setTimeout(pollForAccounts, 1000);
  }, [channels, fetchAccounts, toast]);

  // Normaliser les canaux connectés
  useEffect(() => {
    if (channels.length > 0) {
      console.log('📊 Mise à jour des canaux connectés, nombre:', channels.length);
      const normalizedChannels: Channel[] = channels
        .filter(ch => ch.status === 'connected')
        .map((ch, index) => ({
          id: ch.id,
          user_id: user?.id || 'user1',
          channel_type: ch.channel_type as any,
          unipile_account_id: ch.unipile_account_id,
          status: 'connected' as const,
          priority_order: index + 1,
          connected_at: new Date().toISOString()
        }));
      
      setConnectedChannels(normalizedChannels);
    }
  }, [channels, user?.id]);

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      oauthManagerRef.current.cleanup();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleConnectProvider = async (provider: string) => {
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
    
    // Arrêter le polling précédent s'il existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    try {
      console.log(`🔌 Tentative de connexion ${provider}...`);
      const result = await connectAccount(provider);
      
      console.log(`📄 Réponse reçue pour ${provider}:`, result);
      
      if (result.qr_code) {
        // Pour WhatsApp, afficher le QR code
        console.log('📱 QR Code WhatsApp reçu');
        setQrCode(result.qr_code);
        setConnecting(null);
        toast({
          title: "QR Code généré",
          description: "Scannez le QR code avec WhatsApp pour connecter votre compte",
        });
      } else if (result.authorization_url) {
        // Pour OAuth, utiliser le gestionnaire de fenêtre + polling
        console.log('🔗 URL d\'autorisation reçue pour', provider);
        
        setTimeout(() => {
          const authWindow = oauthManagerRef.current.openAuthWindow(result.authorization_url, provider);
          
          if (authWindow) {
            const handleComplete = () => {
              console.log(`🔄 Fenêtre fermée pour ${provider}, démarrage polling`);
              // Démarrer le polling pour détecter le nouveau compte
              startPollingForNewAccounts(provider);
            };

            oauthManagerRef.current.startWindowMonitoring(authWindow, provider, handleComplete, toast);
            
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
        fetchAccountsOnce();
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
  };

  const handleRefreshAccounts = async () => {
    if (fetchingRef.current) return;
    console.log('🔄 ACTUALISATION MANUELLE des comptes...');
    setConnecting(null);
    
    // Arrêter le polling s'il est actif
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    await fetchAccountsOnce();
  };

  const handleQRError = (message: string) => {
    toast({
      title: "Erreur QR Code",
      description: message,
      variant: "destructive",
    });
  };

  return {
    user,
    channels,
    connectedChannels,
    loading,
    error,
    connecting,
    qrCode,
    hasInitialized,
    fetchingRef,
    handleConnectProvider,
    handleRefreshAccounts,
    handleQRError,
    setQrCode,
    fetchAccountsOnce
  };
};
