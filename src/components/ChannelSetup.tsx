
import React from 'react';
import { useChannelSetup } from '@/hooks/useChannelSetup';
import ChannelSetupLayout from './channel-setup/ChannelSetupLayout';
import OAuthParametersHandler from './channel-setup/OAuthParametersHandler';

interface ChannelSetupProps {
  onComplete: () => void;
}

const ChannelSetup = ({ onComplete }: ChannelSetupProps) => {
  const {
    user,
    channels,
    connectedChannels,
    loading,
    error,
    connecting,
    qrCode,
    hasInitialized,
    fetchingRef,
    handleConnectProvider,
    handleRefreshAccounts,
    handleQRError,
    setQrCode,
    fetchAccountsOnce
  } = useChannelSetup();

  const handleOAuthSuccess = (provider: string) => {
    // Forcer un rafraîchissement après un délai
    setTimeout(() => {
      fetchAccountsOnce();
    }, 1000);
  };

  const handleOAuthFailure = (provider: string) => {
    // Pas d'action spécifique nécessaire
  };

  return (
    <>
      <OAuthParametersHandler
        onConnectionSuccess={handleOAuthSuccess}
        onConnectionFailure={handleOAuthFailure}
      />
      
      <ChannelSetupLayout
        user={user}
        channels={channels}
        connectedChannelsCount={connectedChannels.length}
        loading={loading || !hasInitialized}
        error={error}
        connecting={connecting}
        qrCode={qrCode}
        isRefreshing={fetchingRef.current}
        onConnect={handleConnectProvider}
        onRefresh={handleRefreshAccounts}
        onComplete={onComplete}
        onQRClose={() => setQrCode(null)}
        onQRRegenerate={() => handleConnectProvider('whatsapp')}
        onQRError={handleQRError}
      />
    </>
  );
};

export default ChannelSetup;
