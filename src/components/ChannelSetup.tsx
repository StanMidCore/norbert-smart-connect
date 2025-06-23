
import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useUnipile } from '@/hooks/useUnipile';
import { useNorbertUser } from '@/hooks/useNorbertUser';
import { useToast } from '@/hooks/use-toast';
import type { Channel } from '@/types/norbert';
import { OAuthWindowManager } from './channel-setup/OAuthWindowManager';
import ChannelSetupHeader from './channel-setup/ChannelSetupHeader';
import ErrorDisplay from './channel-setup/ErrorDisplay';
import QRCodeDialog from './channel-setup/QRCodeDialog';
import ConnectedChannelsList from './channel-setup/ConnectedChannelsList';
import AvailableProvidersList from './channel-setup/AvailableProvidersList';
import ChannelSetupActions from './channel-setup/ChannelSetupActions';

interface ChannelSetupProps {
  onComplete: () => void;
}

const ChannelSetup = ({ onComplete }: ChannelSetupProps) => {
  const { channels, loading, error, fetchAccounts, connectAccount } = useUnipile();
  const { user, getCurrentUser } = useNorbertUser();
  const { toast } = useToast();
  const [connectedChannels, setConnectedChannels] = useState<Channel[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasLoadedAccounts, setHasLoadedAccounts] = useState(false);
  const fetchingRef = useRef(false);
  const oauthManagerRef = useRef(new OAuthWindowManager());

  // Initialiser l'utilisateur au chargement - une seule fois
  useEffect(() => {
    if (!user && !hasInitialized) {
      console.log('🔄 Initialisation utilisateur...');
      getCurrentUser();
      setHasInitialized(true);
    }
  }, [user, getCurrentUser, hasInitialized]);

  // Récupérer les comptes une seule fois quand l'utilisateur est disponible
  const fetchAccountsOnce = useCallback(async () => {
    if (user && !fetchingRef.current && !loading && !hasLoadedAccounts) {
      console.log('📡 Récupération des comptes pour:', user.email);
      fetchingRef.current = true;
      setHasLoadedAccounts(true);
      try {
        await fetchAccounts();
        console.log('✅ Comptes récupérés avec succès');
      } catch (err) {
        console.error('❌ Erreur récupération comptes:', err);
      } finally {
        fetchingRef.current = false;
      }
    }
  }, [user, fetchAccounts, loading, hasLoadedAccounts]);

  useEffect(() => {
    fetchAccountsOnce();
  }, [fetchAccountsOnce]);

  // Vérifier les paramètres URL pour les redirections OAuth
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
      setConnecting(null);
      setHasLoadedAccounts(false);
      fetchAccountsOnce();
    } else if (connection === 'failed' && provider) {
      console.log(`❌ Connexion ${provider} échouée via URL`);
      toast({
        title: "Échec de la connexion",
        description: `Impossible de connecter votre compte ${provider}`,
        variant: "destructive",
      });
      window.history.replaceState({}, '', window.location.pathname);
      setConnecting(null);
    }
  }, [toast, fetchAccountsOnce]);

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
        // Pour OAuth, utiliser le gestionnaire de fenêtre
        console.log('🔗 URL d\'autorisation reçue:', result.authorization_url);
        
        const authWindow = oauthManagerRef.current.openAuthWindow(result.authorization_url, provider);
        
        if (authWindow) {
          const handleComplete = () => {
            setConnecting(null);
            setHasLoadedAccounts(false);
            fetchAccountsOnce();
          };

          oauthManagerRef.current.startWindowMonitoring(authWindow, provider, handleComplete, toast);
          
          toast({
            title: "Autorisation en cours",
            description: `Autorisez l'accès à ${provider} dans la nouvelle fenêtre. Elle se fermera automatiquement dans 1 minute.`,
          });
        } else {
          throw new Error('Impossible d\'ouvrir la fenêtre d\'autorisation. Vérifiez que les popups ne sont pas bloquées.');
        }
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
        if (!fetchingRef.current) {
          setHasLoadedAccounts(false);
          await fetchAccountsOnce();
        }
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
    console.log('🔄 Actualisation manuelle des comptes...');
    setConnecting(null);
    setHasLoadedAccounts(false);
    await fetchAccountsOnce();
  };

  const handleQRError = (message: string) => {
    toast({
      title: "Erreur QR Code",
      description: message,
      variant: "destructive",
    });
  };

  if (loading || !user || !hasInitialized) {
    return (
      <div className="min-h-screen bg-app-bg p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-main">Chargement de votre compte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg p-4">
      <div className="max-w-md mx-auto">
        <ChannelSetupHeader userEmail={user.email} />

        {error && (
          <ErrorDisplay 
            error={error}
            onRetry={handleRefreshAccounts}
            isRetrying={fetchingRef.current}
          />
        )}

        <QRCodeDialog
          qrCode={qrCode}
          connecting={connecting}
          onClose={() => setQrCode(null)}
          onRegenerate={() => handleConnectProvider('whatsapp')}
          onError={handleQRError}
        />

        <ConnectedChannelsList channels={channels} />

        <AvailableProvidersList
          channels={channels}
          connecting={connecting}
          onConnect={handleConnectProvider}
        />

        <ChannelSetupActions
          connectedChannelsCount={connectedChannels.length}
          onComplete={onComplete}
          onRefresh={handleRefreshAccounts}
          isRefreshing={fetchingRef.current}
        />
      </div>
    </div>
  );
};

export default ChannelSetup;
