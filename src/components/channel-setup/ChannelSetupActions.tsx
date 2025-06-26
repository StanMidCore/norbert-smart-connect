
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface ChannelSetupActionsProps {
  connectedChannelsCount: number;
  onComplete: () => void;
  onRefresh: () => void;
  onCleanup?: () => void;
  isRefreshing: boolean;
}

const ChannelSetupActions = ({ 
  connectedChannelsCount, 
  onComplete
}: ChannelSetupActionsProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <Button 
          onClick={onComplete}
          disabled={connectedChannelsCount === 0}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {connectedChannelsCount > 0 
            ? `Continuer avec ${connectedChannelsCount} canal${connectedChannelsCount > 1 ? 'x' : ''}`
            : 'Connectez au moins un canal'
          }
        </Button>
      </CardContent>
    </Card>
  );
};

export default ChannelSetupActions;
