
import { useRef, useEffect } from 'react';
import { OAuthWindowManager } from '@/components/channel-setup/OAuthWindowManager';
import type { ToastFunction } from '@/components/channel-setup/utils/WindowMonitor';

export const useOAuthWindow = () => {
  const oauthManagerRef = useRef(new OAuthWindowManager());

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      oauthManagerRef.current.cleanup();
    };
  }, []);

  const openAuthWindow = (authUrl: string, provider: string, onComplete: () => void, toast: ToastFunction) => {
    const authWindow = oauthManagerRef.current.openAuthWindow(authUrl, provider);
    
    if (authWindow) {
      oauthManagerRef.current.startWindowMonitoring(authWindow, provider, onComplete, toast);
      return true;
    }
    return false;
  };

  return {
    openAuthWindow,
    cleanup: () => oauthManagerRef.current.cleanup()
  };
};
