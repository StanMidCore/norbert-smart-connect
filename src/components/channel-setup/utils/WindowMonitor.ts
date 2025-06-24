
export interface ToastFunction {
  (toast: { title: string; description: string; variant?: 'destructive' }): void;
}

export class WindowMonitor {
  private checkWindowInterval: NodeJS.Timeout | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private readonly MAX_CHECKS = 30; // Réduit à 30 secondes

  startMonitoring(
    authWindow: Window,
    provider: string,
    onComplete: () => void,
    onToast: ToastFunction
  ): void {
    if (this.checkWindowInterval) {
      clearInterval(this.checkWindowInterval);
    }

    // Nettoyer l'ancien listener s'il existe
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }

    console.log(`🔍 Début surveillance fenêtre ${provider}`);
    let checkCount = 0;

    // Écouter les messages de la popup OAuth
    this.messageListener = (event: MessageEvent) => {
      console.log('📨 Message reçu de la popup:', event.data);
      
      if (event.data?.type === 'oauth-callback') {
        const { connection, provider: callbackProvider, success } = event.data;
        
        if (callbackProvider === provider) {
          console.log(`🎯 Callback OAuth reçu pour ${provider}:`, { connection, success });
          
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
            
            // Actualiser les comptes immédiatement
            setTimeout(() => {
              console.log(`🔄 Actualisation des comptes après callback ${provider}`);
              onComplete();
            }, 500);
          } else {
            onToast({
              title: "Échec de la connexion",
              description: `Impossible de connecter votre compte ${provider}`,
              variant: "destructive",
            });
          }
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
          console.log(`🔒 Fenêtre ${provider} fermée`);
          this.cleanup();
          
          // Actualiser les comptes après fermeture
          setTimeout(() => {
            console.log(`🔄 Actualisation des comptes après fermeture ${provider}`);
            onComplete();
          }, 1000);
          return;
        }

        // Fermeture automatique après 30 secondes
        if (checkCount >= this.MAX_CHECKS) {
          console.log(`⏰ Fermeture automatique après 30 secondes pour ${provider}`);
          authWindow.close();
          
          this.cleanup();
          
          onToast({
            title: "Connexion en cours",
            description: `Vérification de la connexion ${provider} en cours...`,
          });
          
          // Actualiser les comptes
          setTimeout(() => {
            console.log(`🔄 Actualisation automatique des comptes pour ${provider}`);
            onComplete();
          }, 1000);
          
          return;
        }

        // Programmer la prochaine vérification
        if (checkCount < this.MAX_CHECKS) {
          this.checkWindowInterval = setTimeout(checkWindow, 1000);
        }

      } catch (error) {
        console.log(`⚠️ Erreur surveillance ${provider}:`, error);
        if (checkCount < this.MAX_CHECKS) {
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
  }
}
