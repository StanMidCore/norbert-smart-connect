
import React from 'react';
import { Loader2 } from 'lucide-react';
import ChannelSetupHeader from './ChannelSetupHeader';
import ErrorDisplay from './ErrorDisplay';
import QRCodeDialog from './QRCodeDialog';
import ConnectedChannelsList from './ConnectedChannelsList';
import AvailableProvidersList from './AvailableProvidersList';
import ChannelSetupActions from './ChannelSetupActions';
import type { UnipileChannel } from '@/hooks/useUnipile';

interface ChannelSetupLayoutProps {
  user: any;
  channels: UnipileChannel[];
  connectedChannelsCount: number;
  loading: boolean;
  error: string | null;
  connecting: string | null;
  qrCode: string | null;
  isRefreshing: boolean;
  onConnect: (provider: string) => void;
  onRefresh: () => void;
  onCleanup?: () => void;
  onComplete: () => void;
  onQRClose: () => void;
  onQRRegenerate: () => void;
  onQRError: (message: string) => void;
}

const ChannelSetupLayout = ({
  user,
  channels,
  connectedChannelsCount,
  loading,
  error,
  connecting,
  qrCode,
  isRefreshing,
  onConnect,
  onRefresh,
  onCleanup,
  onComplete,
  onQRClose,
  onQRRegenerate,
  onQRError
}: ChannelSetupLayoutProps) => {
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-app-bg p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-main">Chargement de votre compte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg p-4">
      <div className="max-w-md mx-auto">
        <ChannelSetupHeader userEmail={user.email} />

        {error && (
          <ErrorDisplay 
            error={error}
            onRetry={onRefresh}
            isRetrying={isRefreshing}
          />
        )}

        <QRCodeDialog
          qrCode={qrCode}
          connecting={connecting}
          onClose={onQRClose}
          onRegenerate={onQRRegenerate}
          onError={onQRError}
        />

        <ConnectedChannelsList channels={channels} />

        <AvailableProvidersList
          channels={channels}
          connecting={connecting}
          onConnect={onConnect}
        />

        <ChannelSetupActions
          connectedChannelsCount={connectedChannelsCount}
          onComplete={onComplete}
          onRefresh={onRefresh}
          onCleanup={onCleanup}
          isRefreshing={isRefreshing}
        />
      </div>
    </div>
  );
};

export default ChannelSetupLayout;
