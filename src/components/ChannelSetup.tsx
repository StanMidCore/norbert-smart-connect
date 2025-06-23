import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Mail, Phone, Instagram, Facebook, Loader2, RefreshCw, Plus, QrCode, ExternalLink } from 'lucide-react';
import { useUnipile } from '@/hooks/useUnipile';
import { useNorbertUser } from '@/hooks/useNorbertUser';
import { useToast } from '@/hooks/use-toast';
import type { Channel } from '@/types/norbert';

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
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; provider: string; url: string } | null>(null);
  const fetchingRef = useRef(false);
  
  const channelIcons = {
    whatsapp: MessageSquare,
    email: Mail,
    sms: Phone,
    instagram: Instagram,
    facebook: Facebook,
  };

  const channelColors = {
    whatsapp: 'text-green-600',
    email: 'text-blue-600',
    sms: 'text-purple-600',
    instagram: 'text-pink-600',
    facebook: 'text-blue-700',
  };

  const availableProviders = [
    { id: 'whatsapp', name: 'WhatsApp', description: 'Messages WhatsApp Business' },
    { id: 'gmail', name: 'Gmail', description: 'Emails Gmail' },
    { id: 'outlook', name: 'Outlook', description: 'Emails Outlook' },
    { id: 'instagram', name: 'Instagram', description: 'Messages Instagram' },
    { id: 'facebook', name: 'Facebook', description: 'Messages Facebook' },
  ];

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
      toast({
        title: "Connexion réussie",
        description: `Votre compte ${provider} a été connecté avec succès`,
      });
      // Nettoyer l'URL et actualiser les comptes
      window.history.replaceState({}, '', window.location.pathname);
      if (!fetchingRef.current) {
        setHasLoadedAccounts(false); // Permettre un nouveau chargement
        fetchAccountsOnce();
      }
    } else if (connection === 'failed' && provider) {
      toast({
        title: "Échec de la connexion",
        description: `Impossible de connecter votre compte ${provider}`,
        variant: "destructive",
      });
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
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
    setAuthModal(null);
    
    try {
      console.log(`🔌 Tentative de connexion ${provider}...`);
      const result = await connectAccount(provider);
      
      if (result.qr_code) {
        // Pour WhatsApp, afficher le QR code dans une modale
        console.log('📱 QR Code WhatsApp reçu');
        setQrCode(result.qr_code);
        toast({
          title: "QR Code généré",
          description: "Scannez le QR code avec WhatsApp pour connecter votre compte",
        });
      } else if (result.authorization_url) {
        // Pour OAuth, ouvrir dans une modale/iframe au lieu d'une nouvelle fenêtre
        console.log('🔗 URL d\'autorisation reçue:', result.authorization_url);
        setAuthModal({
          isOpen: true,
          provider: provider,
          url: result.authorization_url
        });
        toast({
          title: "Autorisation requise",
          description: `Connectez-vous à ${provider} dans la fenêtre qui s'ouvre`,
        });
      } else if (result.requires_manual_setup) {
        toast({
          title: "Configuration manuelle requise",
          description: result.error,
          variant: "destructive",
        });
      } else {
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
    } finally {
      setConnecting(null);
    }
  };

  const handleAuthComplete = useCallback(() => {
    console.log('✅ Autorisation terminée, actualisation des comptes...');
    setAuthModal(null);
    setHasLoadedAccounts(false);
    fetchAccountsOnce();
  }, [fetchAccountsOnce]);

  const handleRefreshAccounts = async () => {
    if (fetchingRef.current) return;
    setHasLoadedAccounts(false);
    await fetchAccountsOnce();
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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-main mb-2">
            Connecter vos canaux
          </h1>
          <p className="text-main opacity-70">
            Bonjour {user.email} ! Ajoutez vos comptes pour recevoir et répondre aux messages
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="text-red-600 text-sm">
                <p className="font-medium">Erreur de connexion</p>
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshAccounts}
                  className="mt-2"
                  disabled={fetchingRef.current}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modale QR Code WhatsApp améliorée */}
        {qrCode && (
          <Dialog open={!!qrCode} onOpenChange={() => setQrCode(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  Connexion WhatsApp
                </DialogTitle>
                <DialogDescription>
                  Scannez ce QR code avec WhatsApp Business sur votre téléphone
                </DialogDescription>
              </DialogHeader>
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mx-auto inline-block">
                  <img 
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 mx-auto"
                    onError={(e) => {
                      console.error('❌ Erreur chargement QR code:', e);
                      toast({
                        title: "Erreur QR Code",
                        description: "Format QR code invalide. Veuillez réessayer.",
                        variant: "destructive",
                      });
                      setQrCode(null);
                    }}
                    onLoad={() => console.log('✅ QR code chargé avec succès')}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    1. Ouvrez WhatsApp Business sur votre téléphone
                  </p>
                  <p className="text-sm text-gray-600">
                    2. Allez dans Paramètres {">"} Appareils connectés
                  </p>
                  <p className="text-sm text-gray-600">
                    3. Appuyez sur "Connecter un appareil" et scannez ce code
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleConnectProvider('whatsapp')}
                    disabled={connecting === 'whatsapp'}
                  >
                    {connecting === 'whatsapp' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Régénérer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setQrCode(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Modale OAuth intégrée */}
        {authModal && (
          <Dialog open={authModal.isOpen} onOpenChange={() => setAuthModal(null)}>
            <DialogContent className="sm:max-w-4xl sm:max-h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Connexion {authModal.provider}
                </DialogTitle>
                <DialogDescription>
                  Autorisez l'accès à votre compte {authModal.provider}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Une nouvelle fenêtre va s'ouvrir pour la connexion. 
                    Revenez ici une fois l'autorisation terminée.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => {
                      window.open(authModal.url, '_blank', 'width=500,height=600');
                      toast({
                        title: "Fenêtre ouverte",
                        description: "Terminez la connexion dans la nouvelle fenêtre puis revenez ici",
                      });
                    }}
                    className="bg-cta hover:bg-cta/90"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir la connexion
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setAuthModal(null)}
                  >
                    Annuler
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleAuthComplete}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  J'ai terminé la connexion, actualiser
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Canaux connectés */}
        {connectedChannels.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-main">Canaux connectés</h2>
            {channels.map((channel) => {
              const Icon = channelIcons[channel.channel_type as keyof typeof channelIcons] || MessageSquare;
              const color = channelColors[channel.channel_type as keyof typeof channelColors] || 'text-gray-600';
              
              return (
                <Card key={channel.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-8 w-8 ${color}`} />
                        <div>
                          <h3 className="font-medium text-main">{channel.provider_info?.name || channel.channel_type}</h3>
                          <p className="text-sm text-main opacity-70">
                            {channel.provider_info?.provider || channel.channel_type.toUpperCase()} • {channel.provider_info?.identifier || channel.unipile_account_id}
                          </p>
                        </div>
                      </div>
                      
                      <Badge className="bg-status-success text-white">
                        Connecté
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Canaux disponibles */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-main">
            {connectedChannels.length > 0 ? 'Ajouter d\'autres canaux' : 'Connecter vos premiers canaux'}
          </h2>
          
          {availableProviders
            .filter(provider => !channels.some(ch => ch.provider_info?.provider?.toLowerCase() === provider.id || ch.channel_type === provider.id))
            .map((provider) => {
              const Icon = channelIcons[provider.id as keyof typeof channelIcons] || MessageSquare;
              const color = channelColors[provider.id as keyof typeof channelColors] || 'text-gray-600';
              const isConnecting = connecting === provider.id;
              
              return (
                <Card key={provider.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-8 w-8 ${color}`} />
                        <div>
                          <h3 className="font-medium text-main">{provider.name}</h3>
                          <p className="text-sm text-main opacity-70">{provider.description}</p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleConnectProvider(provider.id)}
                        disabled={isConnecting}
                        size="sm"
                        className="bg-cta hover:bg-cta/90"
                      >
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Connecter
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {connectedChannels.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-main">Configuration automatique</CardTitle>
              <CardDescription className="text-main opacity-70">
                Vos canaux sont automatiquement synchronisés avec Norbert
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-green-700 text-sm">
                  ✓ {connectedChannels.length} canal{connectedChannels.length > 1 ? 's' : ''} configuré{connectedChannels.length > 1 ? 's' : ''}
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Les messages seront traités automatiquement par Norbert
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button 
          onClick={onComplete} 
          className="w-full bg-cta hover:bg-cta/90"
          disabled={connectedChannels.length === 0}
        >
          {connectedChannels.length === 0 
            ? 'Connectez au moins un canal pour continuer' 
            : `Continuer avec ${connectedChannels.length} canal${connectedChannels.length > 1 ? 's' : ''}`
          }
        </Button>

        {connectedChannels.length === 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-main opacity-70 mb-2">
              Connectez vos comptes pour commencer à utiliser Norbert
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSetup;
