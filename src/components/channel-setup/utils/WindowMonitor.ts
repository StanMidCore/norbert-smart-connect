
export interface ToastFunction {
  (toast: { title: string; description: string; variant?: 'destructive' }): void;
}

export class WindowMonitor {
  private checkWindowInterval: NodeJS.Timeout | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private closeListener: ((event: Event) => void) | null = null;
  private readonly MAX_CHECKS = 30; // 30 secondes

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

          // Toujours actualiser les comptes après un callback
          setTimeout(() => {
            console.log(`🔄 Actualisation des comptes après callback ${provider}`);
            onComplete();
          }, 1000);
        }
      } else if (event.data?.type === 'oauth-manual-close') {
        // Gestion explicite de la fermeture manuelle
        console.log(`🔒 Fermeture manuelle détectée pour ${provider}`);
        connectionDetected = true;
        this.cleanup();
        
        // Actualiser après fermeture manuelle
        setTimeout(() => {
          console.log(`🔄 Actualisation après fermeture manuelle ${provider}`);
          onComplete();
        }, 1500);
      }
    };

    // Ajouter l'écouteur de messages
    window.addEventListener('message', this.messageListener);

    // Surveillance traditionnelle de la fenêtre avec vérification plus fréquente
    const checkWindow = () => {
      checkCount++;
      
      try {
        // Vérifier si la fenêtre est fermée manuellement
        if (authWindow.closed) {
          console.log(`🔒 Fenêtre ${provider} fermée`);
          this.cleanup();
          
          // Si pas de callback détecté, forcer la synchronisation
          if (!connectionDetected) {
            console.log(`🔄 Force synchronisation après fermeture ${provider}`);
            setTimeout(() => {
              onComplete();
            }, 1000);
          }
          return;
        }

        // Fermeture automatique après 30 secondes
        if (checkCount >= this.MAX_CHECKS) {
          console.log(`⏰ Fermeture automatique après 30 secondes pour ${provider}`);
          
          try {
            authWindow.close();
          } catch (e) {
            console.log('Erreur fermeture automatique:', e);
          }
          
          this.cleanup();
          
          // Toujours actualiser après timeout
          setTimeout(() => {
            console.log(`🔄 Actualisation automatique après timeout ${provider}`);
            onComplete();
          }, 1000);
          
          return;
        }

        // Programmer la prochaine vérification (toutes les 500ms pour plus de réactivité)
        if (checkCount < this.MAX_CHECKS) {
          this.checkWindowInterval = setTimeout(checkWindow, 500);
        }

      } catch (error) {
        console.log(`⚠️ Erreur surveillance ${provider}:`, error);
        if (checkCount < this.MAX_CHECKS && !connectionDetected) {
          this.checkWindowInterval = setTimeout(checkWindow, 500);
        }
      }
    };

    // Démarrer la surveillance immédiatement
    this.checkWindowInterval = setTimeout(checkWindow, 500);
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
