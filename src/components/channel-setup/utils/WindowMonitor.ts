
export interface ToastFunction {
  (toast: { title: string; description: string; variant?: 'destructive' }): void;
}

export class WindowMonitor {
  private checkWindowInterval: NodeJS.Timeout | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private readonly MAX_CHECKS = 30; // Réduire à 30 secondes

  startMonitoring(
    authWindow: Window,
    provider: string,
    onComplete: () => void,
    onToast: ToastFunction
  ): void {
    if (this.checkWindowInterval) {
      clearInterval(this.checkWindowInterval);
    }

    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }

    console.log(`🔍 Début surveillance fenêtre ${provider}`);
    let checkCount = 0;
    let hasProcessedCallback = false;

    // Écouter les messages de la popup OAuth
    this.messageListener = (event: MessageEvent) => {
      console.log('📨 Message reçu de la popup:', event.data);
      
      if (event.data?.type === 'oauth-callback') {
        const { connection, provider: callbackProvider, success } = event.data;
        
        if (callbackProvider === provider && !hasProcessedCallback) {
          console.log(`🎯 Callback OAuth reçu pour ${provider}:`, { connection, success });
          hasProcessedCallback = true;
          
          this.cleanup();
          
          if (authWindow && !authWindow.closed) {
            try {
              authWindow.close();
            } catch (e) {
              console.log('Fenêtre déjà fermée');
            }
          }
          
          // Toujours appeler onComplete pour déclencher le polling
          setTimeout(() => {
            console.log(`🔄 Déclenchement polling après callback ${provider}`);
            onComplete();
          }, 500);
        }
      } else if (event.data?.type === 'oauth-manual-close' && !hasProcessedCallback) {
        console.log(`🔒 Fermeture manuelle détectée pour ${provider}`);
        hasProcessedCallback = true;
        this.cleanup();
        
        setTimeout(() => {
          console.log(`🔄 Déclenchement polling après fermeture manuelle ${provider}`);
          onComplete();
        }, 500);
      }
    };

    window.addEventListener('message', this.messageListener);

    // Surveillance de la fenêtre
    const checkWindow = () => {
      checkCount++;
      
      try {
        if (authWindow.closed && !hasProcessedCallback) {
          console.log(`🔒 Fenêtre ${provider} fermée (check #${checkCount})`);
          hasProcessedCallback = true;
          this.cleanup();
          
          // Toujours déclencher le polling quand la fenêtre se ferme
          setTimeout(() => {
            console.log(`🔄 Déclenchement polling après fermeture ${provider}`);
            onComplete();
          }, 500);
          return;
        }

        // Timeout après MAX_CHECKS
        if (checkCount >= this.MAX_CHECKS) {
          console.log(`⏰ Timeout surveillance ${provider}`);
          
          if (!hasProcessedCallback) {
            hasProcessedCallback = true;
            
            try {
              authWindow.close();
            } catch (e) {
              console.log('Erreur fermeture automatique:', e);
            }
            
            this.cleanup();
            
            setTimeout(() => {
              console.log(`🔄 Déclenchement polling après timeout ${provider}`);
              onComplete();
            }, 500);
          }
          return;
        }

        if (checkCount < this.MAX_CHECKS && !hasProcessedCallback) {
          this.checkWindowInterval = setTimeout(checkWindow, 1000);
        }

      } catch (error) {
        console.log(`⚠️ Erreur surveillance ${provider}:`, error);
        if (checkCount < this.MAX_CHECKS && !hasProcessedCallback) {
          this.checkWindowInterval = setTimeout(checkWindow, 1000);
        }
      }
    };

    this.checkWindowInterval = setTimeout(checkWindow, 1000);
  }

  cleanup(): void {
    if (this.checkWindowInterval) {
      clearTimeout(this.checkWindowInterval);
      this.checkWindowInterval = null;
    }
    
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
  }
}
