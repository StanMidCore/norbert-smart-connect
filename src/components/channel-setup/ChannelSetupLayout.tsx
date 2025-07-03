
import React from 'react';
import { Loader2 } from 'lucide-react';
import ChannelSetupHeader from './ChannelSetupHeader';
import ErrorDisplay from './ErrorDisplay';
import QRCodeDialog from './QRCodeDialog';
import WhatsAppPhoneInput from './WhatsAppPhoneInput';
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
  whatsappState?: {
    requires_phone_input?: boolean;
    requires_sms?: boolean;
    phone_number?: string;
    account_id?: string;
  } | null;
  isRefreshing: boolean;
  onConnect: (provider: string) => void;
  onRefresh: () => void;
  onCleanup?: () => void;
  onComplete: () => void;
  onQRClose: () => void;
  onQRRegenerate: () => void;
  onQRError: (message: string) => void;
  onWhatsAppSuccess?: () => void;
  onWhatsAppCancel?: () => void;
}

const ChannelSetupLayout = ({
  user,
  channels,
  connectedChannelsCount,
  loading,
  error,
  connecting,
  qrCode,
  whatsappState,
  isRefreshing,
  onConnect,
  onRefresh,
  onCleanup,
  onComplete,
  onQRClose,
  onQRRegenerate,
  onQRError,
  onWhatsAppSuccess,
  onWhatsAppCancel
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
    <div className="min-h-screen bg-app-bg p-4 pt-safe-offset-16 sm:pt-4">
      <div className="max-w-md mx-auto">
        <ChannelSetupHeader userEmail={user.email} />

        {error && (
          <ErrorDisplay 
            error={error}
            onRetry={onRefresh}
            isRetrying={isRefreshing}
          />
        )}

        {whatsappState?.requires_phone_input && whatsappState.account_id && (
          <div className="mb-6">
            <WhatsAppPhoneInput
              accountId={whatsappState.account_id}
              onSuccess={onWhatsAppSuccess || (() => {})}
              onCancel={onWhatsAppCancel || (() => {})}
            />
          </div>
        )}

        <QRCodeDialog
          qrCode={qrCode}
          connecting={connecting}
          onClose={onQRClose}
          onRegenerate={onQRRegenerate}
          onError={onQRError}
        />

        <AvailableProvidersList
          channels={channels}
          connecting={connecting}
          onConnect={onConnect}
        />

        <div className="pb-safe-offset-6">
          <ChannelSetupActions
            connectedChannelsCount={connectedChannelsCount}
            onComplete={onComplete}
            onRefresh={onRefresh}
            onCleanup={onCleanup}
            isRefreshing={isRefreshing}
          />
        </div>
      </div>
    </div>
  );
};

export default ChannelSetupLayout;
