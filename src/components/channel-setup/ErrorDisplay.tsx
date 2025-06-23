
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
  isRetrying: boolean;
}

const ErrorDisplay = ({ error, onRetry, isRetrying }: ErrorDisplayProps) => {
  return (
    <Card className="mb-6 border-red-200">
      <CardContent className="p-4">
        <div className="text-red-600 text-sm">
          <p className="font-medium">Erreur de connexion</p>
          <p>{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2"
            disabled={isRetrying}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorDisplay;
