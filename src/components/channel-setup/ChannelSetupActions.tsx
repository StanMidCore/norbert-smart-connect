
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, CheckCircle, Trash2 } from 'lucide-react';

interface ChannelSetupActionsProps {
  connectedChannelsCount: number;
  onComplete: () => void;
  onRefresh: () => void;
  onCleanup?: () => void;
  isRefreshing: boolean;
}

const ChannelSetupActions = ({ 
  connectedChannelsCount, 
  onComplete, 
  onRefresh, 
  onCleanup,
  isRefreshing 
}: ChannelSetupActionsProps) => {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {onCleanup && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCleanup}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Nettoyer
            </Button>
          )}
        </div>
        
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
