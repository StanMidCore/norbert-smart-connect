
export interface ToastFunction {
  (toast: { title: string; description: string; variant?: 'destructive' }): void;
}

export class WindowMonitor {
  private checkWindowInterval: NodeJS.Timeout | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private closeListener: ((event: Event) => void) | null = null;
  private readonly MAX_CHECKS = 60; // Augmenté à 60 secondes

  startMonitoring(
    authWindow: Window,
    provider: string,
    onComplete: () => void,
    onToast: ToastFunction
  ): void {
    if (this.checkWindowInterval) {
      clearInterval(this.checkWindowInterval);
    }

    // Nettoyer les anciens listeners
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }

    console.log(`🔍 Début surveillance fenêtre ${provider}`);
    let checkCount = 0;
    let connectionDetected = false;

    // Écouter les messages de la popup OAuth
    this.messageListener = (event: MessageEvent) => {
      console.log('📨 Message reçu de la popup:', event.data);
      
      if (event.data?.type === 'oauth-callback') {
        const { connection, provider: callbackProvider, success } = event.data;
        
        if (callbackProvider === provider) {
          console.log(`🎯 Callback OAuth reçu pour ${provider}:`, { connection, success });
          connectionDetected = true;
          
          // Nettoyer la surveillance
          this.cleanup();
          
          // Fermer la fenêtre si elle n'est pas déjà fermée
          if (authWindow && !authWindow.closed) {
            try {
              authWindow.close();
            } catch (e) {
              console.log('Fenêtre déjà fermée');
            }
          }
          
          if (success) {
            onToast({
              title: "Connexion réussie",
              description: `Votre compte ${provider} a été connecté avec succès`,
            });
          } else {
            onToast({
              title: "Échec de la connexion",
              description: `Impossible de connecter votre compte ${provider}`,
              variant: "destructive",
            });
          }

          // TOUJOURS actualiser après un callback
          setTimeout(() => {
            console.log(`🔄 Actualisation forcée après callback ${provider}`);
            onComplete();
          }, 2000);
        }
      } else if (event.data?.type === 'oauth-manual-close') {
        console.log(`🔒 Fermeture manuelle détectée pour ${provider}`);
        connectionDetected = true;
        this.cleanup();
        
        // Actualiser même après fermeture manuelle
        setTimeout(() => {
          console.log(`🔄 Actualisation après fermeture manuelle ${provider}`);
          onComplete();
        }, 2000);
      }
    };

    // Ajouter l'écouteur de messages
    window.addEventListener('message', this.messageListener);

    // Surveillance traditionnelle de la fenêtre
    const checkWindow = () => {
      checkCount++;
      
      try {
        // Vérifier si la fenêtre est fermée
        if (authWindow.closed) {
          console.log(`🔒 Fenêtre ${provider} fermée (check #${checkCount})`);
          this.cleanup();
          
          // TOUJOURS synchroniser quand la fenêtre se ferme
          console.log(`🔄 Synchronisation forcée après fermeture ${provider}`);
          setTimeout(() => {
            onComplete();
          }, 1500);
          return;
        }

        // Vérifier l'URL de la fenêtre pour détecter les redirections
        try {
          const windowUrl = authWindow.location.href;
          if (windowUrl && windowUrl.includes('oauth-callback')) {
            console.log(`🔗 Détection redirect OAuth dans l'URL: ${windowUrl}`);
            connectionDetected = true;
            this.cleanup();
            
            // Forcer la synchronisation
            setTimeout(() => {
              console.log(`🔄 Synchronisation après détection URL ${provider}`);
              onComplete();
            }, 1500);
            return;
          }
        } catch (urlError) {
          // Normal si cross-origin, continuer la surveillance
        }

        // Fermeture automatique après timeout
        if (checkCount >= this.MAX_CHECKS) {
          console.log(`⏰ Fermeture automatique après ${this.MAX_CHECKS} secondes pour ${provider}`);
          
          try {
            authWindow.close();
          } catch (e) {
            console.log('Erreur fermeture automatique:', e);
          }
          
          this.cleanup();
          
          // Synchroniser après timeout
          setTimeout(() => {
            console.log(`🔄 Synchronisation après timeout ${provider}`);
            onComplete();
          }, 1500);
          
          return;
        }

        // Programmer la prochaine vérification
        if (checkCount < this.MAX_CHECKS) {
          this.checkWindowInterval = setTimeout(checkWindow, 1000);
        }

      } catch (error) {
        console.log(`⚠️ Erreur surveillance ${provider}:`, error);
        if (checkCount < this.MAX_CHECKS && !connectionDetected) {
          this.checkWindowInterval = setTimeout(checkWindow, 1000);
        }
      }
    };

    // Démarrer la surveillance immédiatement
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

    if (this.closeListener) {
      window.removeEventListener('beforeunload', this.closeListener);
      this.closeListener = null;
    }
  }
}
