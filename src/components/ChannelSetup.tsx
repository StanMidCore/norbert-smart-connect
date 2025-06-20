
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Phone, Instagram, Facebook, Loader2, RefreshCw } from 'lucide-react';
import { useUnipile } from '@/hooks/useUnipile';
import type { Channel } from '@/types/norbert';

interface ChannelSetupProps {
  onComplete: () => void;
}

const ChannelSetup = ({ onComplete }: ChannelSetupProps) => {
  const { channels, loading, error, fetchAccounts } = useUnipile();
  const [connectedChannels, setConnectedChannels] = useState<Channel[]>([]);
  
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

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-main">Récupération de vos canaux Unipile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-main mb-2">
            Vos canaux connectés
          </h1>
          <p className="text-main opacity-70">
            Canaux détectés depuis votre compte Unipile
          </p>
        </div>

        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="text-red-600 text-sm">
                <p className="font-medium">Erreur de connexion Unipile</p>
                <p>{error}</p>
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

        <div className="space-y-4 mb-6">
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
            ? 'Aucun canal détecté' 
            : `Continuer avec ${connectedChannels.length} canal${connectedChannels.length > 1 ? 's' : ''}`
          }
        </Button>

        {connectedChannels.length === 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-main opacity-70 mb-2">
              Aucun canal Unipile détecté
            </p>
            <Button 
              variant="outline" 
              onClick={fetchAccounts}
              className="text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSetup;
