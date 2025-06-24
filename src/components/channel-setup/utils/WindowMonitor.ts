
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
      }
    };

    // Ajouter l'écouteur de messages
    window.addEventListener('message', this.messageListener);

    // Surveillance traditionnelle de la fenêtre
    const checkWindow = () => {
      checkCount++;
      
      try {
        // Vérifier si la fenêtre est fermée manuellement
        if (authWindow.closed) {
          console.log(`🔒 Fenêtre ${provider} fermée manuellement`);
          this.cleanup();
          
          // Si pas de connexion détectée, actualiser quand même pour vérifier
          if (!connectionDetected) {
            setTimeout(() => {
              console.log(`🔄 Actualisation des comptes après fermeture manuelle ${provider}`);
              onComplete();
            }, 1500);
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
          
          // Si pas de connexion détectée, montrer un message informatif
          if (!connectionDetected) {
            onToast({
              title: "Vérification en cours",
              description: `Vérification de la connexion ${provider}...`,
            });
          }
          
          // Actualiser les comptes dans tous les cas
          setTimeout(() => {
            console.log(`🔄 Actualisation automatique des comptes pour ${provider}`);
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

    // Démarrer la surveillance
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
