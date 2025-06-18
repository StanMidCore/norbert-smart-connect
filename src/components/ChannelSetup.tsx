
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Phone, Instagram, Facebook, Plus, Check } from 'lucide-react';
import type { Channel } from '@/types/norbert';

interface ChannelSetupProps {
  onComplete: () => void;
}

const ChannelSetup = ({ onComplete }: ChannelSetupProps) => {
  const [connectedChannels, setConnectedChannels] = useState<Channel[]>([]);
  
  const availableChannels = [
    {
      type: 'whatsapp' as const,
      name: 'WhatsApp Business',
      icon: MessageSquare,
      color: 'text-green-600',
      description: 'Messages WhatsApp Business'
    },
    {
      type: 'email' as const,
      name: 'Email',
      icon: Mail,
      color: 'text-blue-600',
      description: 'Gmail, Outlook, etc.'
    },
    {
      type: 'sms' as const,
      name: 'SMS',
      icon: Phone,
      color: 'text-purple-600',
      description: 'Messages texte'
    },
    {
      type: 'instagram' as const,
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      description: 'Messages Instagram'
    },
    {
      type: 'facebook' as const,
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-700',
      description: 'Messages Facebook'
    }
  ];

  const connectChannel = (channelType: string) => {
    const newChannel: Channel = {
      id: `${channelType}_${Date.now()}`,
      user_id: 'user1',
      channel_type: channelType as any,
      unipile_account_id: `unipile_${channelType}`,
      status: 'connected',
      priority_order: connectedChannels.length + 1,
      connected_at: new Date().toISOString()
    };
    
    setConnectedChannels([...connectedChannels, newChannel]);
  };

  const isChannelConnected = (channelType: string) => {
    return connectedChannels.some(channel => channel.channel_type === channelType);
  };

  return (
    <div className="min-h-screen bg-app-bg p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-main mb-2">
            Connectez vos canaux
          </h1>
          <p className="text-main opacity-70">
            Choisissez les plateformes que Norbert doit surveiller pour vous
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {availableChannels.map((channel) => {
            const Icon = channel.icon;
            const isConnected = isChannelConnected(channel.type);
            
            return (
              <Card key={channel.type} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-8 w-8 ${channel.color}`} />
                      <div>
                        <h3 className="font-medium text-main">{channel.name}</h3>
                        <p className="text-sm text-main opacity-70">{channel.description}</p>
                      </div>
                    </div>
                    
                    {isConnected ? (
                      <Badge className="bg-status-success text-white">
                        <Check className="h-3 w-3 mr-1" />
                        Connecté
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => connectChannel(channel.type)}
                        className="flex items-center space-x-1 bg-cta hover:bg-cta/90"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Connecter</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {connectedChannels.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-main">Ordre de priorité</CardTitle>
              <CardDescription className="text-main opacity-70">
                Glissez pour réorganiser l'ordre de traitement des messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {connectedChannels.map((channel, index) => {
                  const channelInfo = availableChannels.find(c => c.type === channel.channel_type);
                  const Icon = channelInfo?.icon || MessageSquare;
                  
                  return (
                    <div key={channel.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-main opacity-70">#{index + 1}</span>
                      <Icon className={`h-5 w-5 ${channelInfo?.color}`} />
                      <span className="font-medium text-main">{channelInfo?.name}</span>
                    </div>
                  );
                })}
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
            ? 'Connectez au moins un canal' 
            : `Continuer avec ${connectedChannels.length} canal${connectedChannels.length > 1 ? 's' : ''}`
          }
        </Button>
      </div>
    </div>
  );
};

export default ChannelSetup;
