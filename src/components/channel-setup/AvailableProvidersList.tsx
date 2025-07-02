
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Instagram, Loader2, AlertCircle } from 'lucide-react';
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
      description: 'Configuration en cours - Contactez le support',
      available: false,
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: Mail,
      color: 'text-blue-600',
      description: 'Configuration en cours - Contactez le support',
      available: false,
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
          <Card key={provider.id} className={`cursor-pointer hover:shadow-md transition-shadow ${!provider.available ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-8 w-8 ${provider.color}`} />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-main">{provider.name}</h3>
                      {!provider.available && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
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
                      disabled={isConnecting || !provider.available}
                      variant="outline"
                      size="sm"
                      className="min-w-20"
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Connexion...
                        </>
                      ) : !provider.available ? (
                        'Bientôt'
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
      
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Information</h3>
              <p className="text-sm text-blue-700">
                Gmail et Outlook sont en cours de configuration. 
                WhatsApp et Instagram sont disponibles dès maintenant !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailableProvidersList;
