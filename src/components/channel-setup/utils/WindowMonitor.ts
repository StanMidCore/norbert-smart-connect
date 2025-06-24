
export interface ToastFunction {
  (toast: { title: string; description: string; variant?: 'destructive' }): void;
}

export class WindowMonitor {
  private checkWindowInterval: NodeJS.Timeout | null = null;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private readonly MAX_CHECKS = 60; // 1 minute max (60 * 1000ms)

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
          
          // Actualiser les comptes après un court délai
          setTimeout(() => {
            console.log(`🔄 Actualisation des comptes après callback ${provider}`);
            onComplete();
          }, 1000);
        }
      }
    };

    // Ajouter l'écouteur de messages
    window.addEventListener('message', this.messageListener);

    // Surveillance traditionnelle de la fenêtre pour les cas où les messages ne marchent pas
    const checkWindow = () => {
      checkCount++;
      
      try {
        // Vérifier si la fenêtre est fermée manuellement
        if (authWindow.closed) {
          console.log(`🔒 Fenêtre ${provider} fermée manuellement`);
          this.cleanup();
          
          // Actualiser les comptes après fermeture manuelle
          setTimeout(() => {
            console.log(`🔄 Actualisation des comptes après fermeture manuelle ${provider}`);
            onComplete();
          }, 1000);
          return;
        }

        // Fermeture automatique après 1 minute pour éviter le blocage
        if (checkCount >= this.MAX_CHECKS) {
          console.log(`⏰ Fermeture automatique après 1 minute pour ${provider}`);
          authWindow.close();
          
          this.cleanup();
          
          onToast({
            title: "Fenêtre fermée automatiquement",
            description: `La fenêtre ${provider} a été fermée. Si vous avez terminé l'autorisation, vos comptes vont être actualisés.`,
          });
          
          // Actualiser les comptes
          setTimeout(() => {
            console.log(`🔄 Actualisation automatique des comptes pour ${provider}`);
            onComplete();
          }, 2000);
          
          return;
        }

        // Programmer la prochaine vérification de manière non-bloquante
        if (!authWindow.closed && checkCount < this.MAX_CHECKS) {
          this.checkWindowInterval = setTimeout(checkWindow, 1000);
        }

      } catch (error) {
        // Erreur générale, continuer la surveillance
        console.log(`⚠️ Erreur surveillance ${provider}:`, error);
        if (!authWindow.closed && checkCount < this.MAX_CHECKS) {
          this.checkWindowInterval = setTimeout(checkWindow, 1000);
        }
      }
    };

    // Démarrer la surveillance avec un délai initial
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
