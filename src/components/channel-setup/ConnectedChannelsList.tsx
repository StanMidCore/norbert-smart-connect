
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Phone, Instagram, Facebook } from 'lucide-react';
import type { UnipileChannel } from '@/hooks/useUnipile';

interface ConnectedChannelsListProps {
  channels: UnipileChannel[];
}

const ConnectedChannelsList = ({ channels }: ConnectedChannelsListProps) => {
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

  if (channels.length === 0) {
    return null;
  }

  return (
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
  );
};

export default ConnectedChannelsList;
