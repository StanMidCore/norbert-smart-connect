
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Instagram, Loader2 } from 'lucide-react';
import type { UnipileChannel } from '@/hooks/useUnipile';

interface AvailableProvidersListProps {
  channels: UnipileChannel[];
  connecting: string | null;
  onConnect: (provider: string) => void;
}

const AvailableProvidersList = ({ channels, connecting, onConnect }: AvailableProvidersListProps) => {
  const availableProviders = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: MessageSquare,
      color: 'text-green-600',
      description: 'Connectez votre WhatsApp Business',
      available: true,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      description: 'Connectez votre compte Instagram',
      available: true,
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      color: 'text-red-600',
      description: 'Connectez votre compte Gmail',
      available: true,
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: Mail,
      color: 'text-blue-600',
      description: 'Connectez votre compte Outlook',
      available: true,
    },
  ];

  const connectedProviderIds = channels.map(ch => ch.channel_type.toLowerCase());

  return (
    <div className="space-y-4 mb-6">
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
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-main">{provider.name}</h3>
                    </div>
                    <p className="text-sm text-main opacity-70">{provider.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Badge className="bg-status-success text-white">
                      Connecté
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AvailableProvidersList;
