
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Instagram, Facebook, Plus, Loader2 } from 'lucide-react';
import type { UnipileChannel } from '@/hooks/useUnipile';

interface AvailableProvider {
  id: string;
  name: string;
  description: string;
}

interface AvailableProvidersListProps {
  channels: UnipileChannel[];
  connecting: string | null;
  onConnect: (provider: string) => void;
}

const AvailableProvidersList = ({ channels, connecting, onConnect }: AvailableProvidersListProps) => {
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

  const availableProviders: AvailableProvider[] = [
    { id: 'whatsapp', name: 'WhatsApp', description: 'Messages WhatsApp Business' },
    { id: 'gmail', name: 'Gmail', description: 'Emails Gmail' },
    { id: 'outlook', name: 'Outlook', description: 'Emails Outlook' },
    { id: 'instagram', name: 'Instagram', description: 'Messages Instagram' },
    { id: 'facebook', name: 'Facebook', description: 'Messages Facebook' },
  ];

  const filteredProviders = availableProviders.filter(provider => 
    !channels.some(ch => 
      ch.provider_info?.provider?.toLowerCase() === provider.id || 
      ch.channel_type === provider.id
    )
  );

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-lg font-semibold text-main">
        {channels.length > 0 ? 'Ajouter d\'autres canaux' : 'Connecter vos premiers canaux'}
      </h2>
      
      {filteredProviders.map((provider) => {
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
                  onClick={() => onConnect(provider.id)}
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
  );
};

export default AvailableProvidersList;
