
export interface ToastFunction {
  (toast: { title: string; description: string; variant?: 'destructive' }): void;
}

export class WindowMonitor {
  private checkWindowInterval: NodeJS.Timeout | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private closeListener: ((event: Event) => void) | null = null;
  private readonly MAX_CHECKS = 60;

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
    let hasProcessedCallback = false;

    // Écouter les messages de la popup OAuth
    this.messageListener = (event: MessageEvent) => {
      console.log('📨 Message reçu de la popup:', event.data);
      
      if (event.data?.type === 'oauth-callback') {
        const { connection, provider: callbackProvider, success } = event.data;
        
        if (callbackProvider === provider && !hasProcessedCallback) {
          console.log(`🎯 Callback OAuth reçu pour ${provider}:`, { connection, success });
          hasProcessedCallback = true;
          
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
            
            // SYNCHRONISATION FORCÉE après succès
            setTimeout(() => {
              console.log(`🔄 SYNCHRONISATION FORCÉE après succès ${provider}`);
              onComplete();
            }, 1000);
          } else {
            onToast({
              title: "Échec de la connexion",
              description: `Impossible de connecter votre compte ${provider}`,
              variant: "destructive",
            });
          }
        }
      } else if (event.data?.type === 'oauth-manual-close' && !hasProcessedCallback) {
        console.log(`🔒 Fermeture manuelle détectée pour ${provider}`);
        hasProcessedCallback = true;
        this.cleanup();
        
        // Synchroniser même après fermeture manuelle (au cas où la connexion a réussi)
        setTimeout(() => {
          console.log(`🔄 Synchronisation après fermeture manuelle ${provider}`);
          onComplete();
        }, 1500);
      }
    };

    // Ajouter l'écouteur de messages
    window.addEventListener('message', this.messageListener);

    // Surveillance traditionnelle de la fenêtre
    const checkWindow = () => {
      checkCount++;
      
      try {
        // Vérifier si la fenêtre est fermée
        if (authWindow.closed && !hasProcessedCallback) {
          console.log(`🔒 Fenêtre ${provider} fermée (check #${checkCount})`);
          hasProcessedCallback = true;
          this.cleanup();
          
          // TOUJOURS synchroniser quand la fenêtre se ferme
          console.log(`🔄 SYNCHRONISATION FORCÉE après fermeture ${provider}`);
          setTimeout(() => {
            onComplete();
          }, 500);
          return;
        }

        // Vérifier l'URL de la fenêtre pour détecter les redirections
        try {
          const windowUrl = authWindow.location.href;
          if (windowUrl && windowUrl.includes('oauth-callback') && !hasProcessedCallback) {
            console.log(`🔗 Détection redirect OAuth dans l'URL: ${windowUrl}`);
            hasProcessedCallback = true;
            this.cleanup();
            
            // Extraire les paramètres pour déterminer le succès
            const urlParams = new URLSearchParams(new URL(windowUrl).search);
            const connection = urlParams.get('connection');
            
            if (connection === 'success') {
              onToast({
                title: "Connexion réussie",
                description: `Votre compte ${provider} a été connecté avec succès`,
              });
            }
            
            // Forcer la synchronisation
            setTimeout(() => {
              console.log(`🔄 SYNCHRONISATION FORCÉE après détection URL ${provider}`);
              onComplete();
            }, 1000);
            return;
          }
        } catch (urlError) {
          // Normal si cross-origin, continuer la surveillance
        }

        // Fermeture automatique après timeout
        if (checkCount >= this.MAX_CHECKS) {
          console.log(`⏰ Fermeture automatique après ${this.MAX_CHECKS} secondes pour ${provider}`);
          
          if (!hasProcessedCallback) {
            hasProcessedCallback = true;
            
            try {
              authWindow.close();
            } catch (e) {
              console.log('Erreur fermeture automatique:', e);
            }
            
            this.cleanup();
            
            // Synchroniser après timeout (au cas où)
            setTimeout(() => {
              console.log(`🔄 Synchronisation après timeout ${provider}`);
              onComplete();
            }, 1000);
          }
          return;
        }

        // Programmer la prochaine vérification
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
