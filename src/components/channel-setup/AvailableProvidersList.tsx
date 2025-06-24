
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Phone, Instagram, Facebook, Loader2 } from 'lucide-react';
import type { UnipileChannel } from '@/hooks/useUnipile';

interface AvailableProvidersListProps {
  channels: UnipileChannel[];
  connecting: string | null;
  onConnect: (provider: string) => void;
}

const AvailableProvidersList = ({ channels, connecting, onConnect }: AvailableProvidersListProps) => {
  const availableProviders = [
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      color: 'text-red-600',
      description: 'Connectez votre compte Gmail',
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: Mail,
      color: 'text-blue-600',
      description: 'Connectez votre compte Outlook',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: MessageSquare,
      color: 'text-green-600',
      description: 'Connectez votre WhatsApp Business',
    },
    {
      id: 'facebook',
      name: 'Facebook Messenger',
      icon: Facebook,
      color: 'text-blue-700',
      description: 'Connectez votre page Facebook',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      description: 'Configuration manuelle requise',
      disabled: true,
    },
  ];

  const connectedProviderIds = channels.map(ch => ch.channel_type.toLowerCase());

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-lg font-semibold text-main">Canaux disponibles</h2>
      
      {availableProviders.map((provider) => {
        const isConnected = connectedProviderIds.includes(provider.id);
        const isConnecting = connecting === provider.id;
        const Icon = provider.icon;
        
        return (
          <Card key={provider.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-8 w-8 ${provider.color}`} />
                  <div>
                    <h3 className="font-medium text-main">{provider.name}</h3>
                    <p className="text-sm text-main opacity-70">{provider.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Badge className="bg-status-success text-white">
                      Connecté
                    </Badge>
                  ) : provider.disabled ? (
                    <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                      Manuel
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => onConnect(provider.id)}
                      disabled={isConnecting}
                      variant="outline"
                      size="sm"
                      className="min-w-20"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Connexion...
                        </>
                      ) : (
                        'Connecter'
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              {provider.id === 'instagram' && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Instagram nécessite une configuration manuelle via votre dashboard Unipile.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AvailableProvidersList;
