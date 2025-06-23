
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface ChannelSetupActionsProps {
  connectedChannelsCount: number;
  onComplete: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const ChannelSetupActions = ({ 
  connectedChannelsCount, 
  onComplete, 
  onRefresh, 
  isRefreshing 
}: ChannelSetupActionsProps) => {
  return (
    <>
      {connectedChannelsCount > 0 && (
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
                ✓ {connectedChannelsCount} canal{connectedChannelsCount > 1 ? 's' : ''} configuré{connectedChannelsCount > 1 ? 's' : ''}
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
        disabled={connectedChannelsCount === 0}
      >
        {connectedChannelsCount === 0 
          ? 'Connectez au moins un canal pour continuer' 
          : `Continuer avec ${connectedChannelsCount} canal${connectedChannelsCount > 1 ? 's' : ''}`
        }
      </Button>

      {connectedChannelsCount === 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-main opacity-70 mb-2">
            Connectez vos comptes pour commencer à utiliser Norbert
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser les comptes
          </Button>
        </div>
      )}
    </>
  );
};

export default ChannelSetupActions;
