
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Phone, Instagram, Facebook, Loader2, RefreshCw, Plus, QrCode } from 'lucide-react';
import { useUnipile } from '@/hooks/useUnipile';
import { useToast } from '@/hooks/use-toast';
import type { Channel } from '@/types/norbert';

interface ChannelSetupProps {
  onComplete: () => void;
}

const ChannelSetup = ({ onComplete }: ChannelSetupProps) => {
  const { channels, loading, error, fetchAccounts, connectAccount } = useUnipile();
  const { toast } = useToast();
  const [connectedChannels, setConnectedChannels] = useState<Channel[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  
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

  useEffect(() => {
    if (channels.length > 0) {
      const normalizedChannels: Channel[] = channels
        .filter(ch => ch.status === 'connected')
        .map((ch, index) => ({
          id: ch.id,
          user_id: 'user1',
          channel_type: ch.channel_type as any,
          unipile_account_id: ch.unipile_account_id,
          status: 'connected' as const,
          priority_order: index + 1,
          connected_at: new Date().toISOString()
        }));
      
      setConnectedChannels(normalizedChannels);
    }
  }, [channels]);

  const handleConnectProvider = async (provider: string) => {
    setConnecting(provider);
    setQrCode(null);
    
    try {
      const result = await connectAccount(provider);
      
      if (result.qr_code) {
        // Pour WhatsApp, afficher le QR code
        setQrCode(result.qr_code);
        toast({
          title: "QR Code généré",
          description: "Scannez le QR code avec WhatsApp pour connecter votre compte",
        });
      } else if (result.authorization_url) {
        // Pour les autres providers, ouvrir l'URL d'autorisation
        window.open(result.authorization_url, '_blank');
        toast({
          title: "Autorisation ouverte",
          description: "Complétez l'autorisation dans le nouvel onglet, puis actualisez cette page",
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
        await fetchAccounts(); // Refresh the list
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      let errorMessage = `Impossible de connecter ${provider}. `;
      
      if (error.message?.includes('Invalid credentials')) {
        errorMessage += 'Clé API Unipile invalide. Veuillez vérifier votre configuration.';
      } else if (error.message?.includes('non-2xx status code')) {
        errorMessage += 'Erreur de configuration du serveur. Veuillez réessayer plus tard.';
      } else {
        errorMessage += 'Veuillez réessayer.';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-main">Chargement de vos canaux...</p>
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
            Ajoutez vos comptes pour recevoir et répondre aux messages
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="text-red-600 text-sm">
                <p className="font-medium">Erreur de connexion</p>
                <p>{error}</p>
                {error.includes('Invalid credentials') && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-xs">
                      💡 <strong>Solution :</strong> La clé API Unipile n'est pas configurée correctement. 
                      Veuillez vérifier votre configuration dans les secrets Supabase.
                    </p>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAccounts}
                  className="mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code pour WhatsApp */}
        {qrCode && (
          <Card className="mb-6 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg text-main flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                WhatsApp QR Code
              </CardTitle>
              <CardDescription>
                Ouvrez WhatsApp sur votre téléphone et scannez ce QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={`data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" className="max-w-48 mx-auto" />
              </div>
              <p className="text-sm text-main opacity-70 mt-2">
                Le QR code expire après quelques minutes
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setQrCode(null)}
                className="mt-2"
              >
                Fermer
              </Button>
            </CardContent>
          </Card>
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
                          <h3 className="font-medium text-main">{channel.provider_info.name}</h3>
                          <p className="text-sm text-main opacity-70">
                            {channel.provider_info.provider} • {channel.provider_info.identifier}
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
            .filter(provider => !channels.some(ch => ch.provider_info.provider.toLowerCase() === provider.id))
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

        {/* Configuration info */}
        <Card className="mb-6 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-main">ℹ️ Information importante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-main opacity-70">
                Pour que les connexions fonctionnent, vous devez :
              </p>
              <ul className="list-disc list-inside space-y-1 text-main opacity-70">
                <li>Configurer votre vraie clé API Unipile dans les secrets Supabase</li>
                <li>Avoir un compte Unipile actif</li>
                <li>WhatsApp nécessite WhatsApp Business</li>
              </ul>
            </div>
          </CardContent>
        </Card>

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
