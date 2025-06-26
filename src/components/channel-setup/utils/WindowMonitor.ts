
export interface ToastFunction {
  (toast: { title: string; description: string; variant?: 'destructive' }): void;
}

export class WindowMonitor {
  private checkWindowInterval: NodeJS.Timeout | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private closeListener: ((event: Event) => void) | null = null;
  private readonly MAX_CHECKS = 120; // Augmenté à 2 minutes pour plus de flexibilité

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
    let connectionHandled = false;

    // Écouter les messages de la popup OAuth
    this.messageListener = (event: MessageEvent) => {
      console.log('📨 Message reçu de la popup:', event.data);
      
      if (event.data?.type === 'oauth-callback' && !connectionHandled) {
        const { connection, provider: callbackProvider, success } = event.data;
        
        if (callbackProvider === provider) {
          console.log(`🎯 Callback OAuth reçu pour ${provider}:`, { connection, success });
          connectionHandled = true;
          
          // Nettoyer la surveillance
          this.cleanup();
          
          // Fermer la fenêtre immédiatement
          if (authWindow && !authWindow.closed) {
            try {
              authWindow.close();
              console.log(`🔒 Fenêtre ${provider} fermée automatiquement`);
            } catch (e) {
              console.log('Fenêtre déjà fermée');
            }
          }
          
          if (success) {
            onToast({
              title: "Connexion réussie",
              description: `Votre compte ${provider} a été connecté avec succès`,
            });
            
            // Actualisation immédiate après succès
            console.log(`🔄 Actualisation immédiate après succès ${provider}`);
            setTimeout(() => {
              onComplete();
            }, 500);
          } else {
            onToast({
              title: "Échec de la connexion",
              description: `Impossible de connecter votre compte ${provider}`,
              variant: "destructive",
            });
            
            // Actualisation même après échec pour nettoyer l'état
            setTimeout(() => {
              onComplete();
            }, 1000);
          }
        }
      } else if (event.data?.type === 'oauth-manual-close' && !connectionHandled) {
        console.log(`🔒 Fermeture manuelle détectée pour ${provider}`);
        connectionHandled = true;
        this.cleanup();
        
        // Actualisation après fermeture manuelle
        setTimeout(() => {
          console.log(`🔄 Actualisation après fermeture manuelle ${provider}`);
          onComplete();
        }, 1000);
      }
    };

    // Ajouter l'écouteur de messages
    window.addEventListener('message', this.messageListener);

    // Surveillance traditionnelle de la fenêtre
    const checkWindow = () => {
      checkCount++;
      
      try {
        // Vérifier si la fenêtre est fermée
        if (authWindow.closed && !connectionHandled) {
          console.log(`🔒 Fenêtre ${provider} fermée (check #${checkCount})`);
          connectionHandled = true;
          this.cleanup();
          
          // TOUJOURS synchroniser quand la fenêtre se ferme
          console.log(`🔄 Synchronisation forcée après fermeture ${provider}`);
          setTimeout(() => {
            onComplete();
          }, 1000);
          return;
        }

        // Vérifier l'URL de la fenêtre pour détecter les redirections
        try {
          const windowUrl = authWindow.location.href;
          if (windowUrl && (windowUrl.includes('oauth-callback') || windowUrl.includes('connection=success')) && !connectionHandled) {
            console.log(`🔗 Détection redirect OAuth dans l'URL: ${windowUrl}`);
            connectionHandled = true;
            this.cleanup();
            
            // Fermer la fenêtre et actualiser
            setTimeout(() => {
              try {
                authWindow.close();
                console.log(`🔒 Fenêtre ${provider} fermée après détection URL`);
              } catch (e) {
                console.log('Erreur fermeture fenêtre:', e);
              }
            }, 500);
            
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
        if (checkCount >= this.MAX_CHECKS && !connectionHandled) {
          console.log(`⏰ Fermeture automatique après ${this.MAX_CHECKS} secondes pour ${provider}`);
          connectionHandled = true;
          
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
          }, 1000);
          
          return;
        }

        // Programmer la prochaine vérification
        if (checkCount < this.MAX_CHECKS && !connectionHandled) {
          this.checkWindowInterval = setTimeout(checkWindow, 1000);
        }

      } catch (error) {
        console.log(`⚠️ Erreur surveillance ${provider}:`, error);
        if (checkCount < this.MAX_CHECKS && !connectionHandled) {
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
