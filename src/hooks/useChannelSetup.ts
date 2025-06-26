
import { useCallback } from 'react';
import { useChannelData } from './useChannelData';
import { useChannelConnection } from './useChannelConnection';

export const useChannelSetup = () => {
  const {
    user,
    channels,
    connectedChannels,
    loading,
    error,
    hasInitialized,
    fetchingRef,
    fetchAccountsOnce,
    handleRefreshAccounts,
    handleCleanupChannels,
    forceRefresh
  } = useChannelData();

  const handleConnectionComplete = useCallback(() => {
    forceRefresh();
  }, [forceRefresh]);

  const {
    connecting,
    qrCode,
    setQrCode,
    handleConnectProvider: baseHandleConnectProvider,
    handleQRError
  } = useChannelConnection(handleConnectionComplete);

  const handleConnectProvider = useCallback((provider: string) => {
    return baseHandleConnectProvider(provider, user);
  }, [baseHandleConnectProvider, user]);

  return {
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
    handleCleanupChannels,
    setQrCode,
    fetchAccountsOnce
  };
};
