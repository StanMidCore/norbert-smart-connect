
export interface ToastFunction {
  (toast: { title: string; description: string; variant?: 'destructive' }): void;
}

export class WindowMonitor {
  private checkWindowInterval: NodeJS.Timeout | null = null;
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

    console.log(`🔍 Début surveillance fenêtre ${provider}`);
    let checkCount = 0;

    // Utiliser requestAnimationFrame pour éviter le blocage de l'UI
    const checkWindow = () => {
      checkCount++;
      
      try {
        // Vérifier si la fenêtre est fermée manuellement
        if (authWindow.closed) {
          console.log(`🔒 Fenêtre ${provider} fermée manuellement`);
          this.cleanup();
          
          // Actualiser les comptes après fermeture
          setTimeout(() => {
            console.log(`🔄 Actualisation des comptes après fermeture fenêtre ${provider}`);
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
  }
}
