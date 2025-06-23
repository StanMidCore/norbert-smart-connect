
export class OAuthWindowManager {
  private authWindowRef: Window | null = null;
  private checkWindowInterval: NodeJS.Timeout | null = null;

  startWindowMonitoring(
    authWindow: Window, 
    provider: string, 
    onComplete: () => void,
    onToast: (toast: { title: string; description: string; variant?: 'destructive' }) => void
  ) {
    if (this.checkWindowInterval) {
      clearInterval(this.checkWindowInterval);
    }

    console.log(`🔍 Début surveillance fenêtre ${provider}`);
    let checkCount = 0;
    const maxChecks = 60; // 1 minute max (60 * 1000ms)

    this.checkWindowInterval = setInterval(() => {
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
        if (checkCount >= maxChecks) {
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

      } catch (error) {
        // Erreur générale, continuer la surveillance
        console.log(`⚠️ Erreur surveillance ${provider}:`, error);
      }
    }, 1000);
  }

  openAuthWindow(url: string, provider: string): Window | null {
    // Fermer la fenêtre précédente si elle existe
    if (this.authWindowRef && !this.authWindowRef.closed) {
      this.authWindowRef.close();
    }
    
    // Calculer la position centrée
    const width = 600;
    const height = 700;
    const left = Math.max(0, Math.floor(window.screen.width / 2 - width / 2));
    const top = Math.max(0, Math.floor(window.screen.height / 2 - height / 2));
    
    // Ouvrir dans une nouvelle fenêtre popup
    const authWindow = window.open(
      url,
      `oauth-${provider}-${Date.now()}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no,directories=no`
    );
    
    if (authWindow) {
      this.authWindowRef = authWindow;
      authWindow.focus();
    }
    
    return authWindow;
  }

  cleanup() {
    if (this.checkWindowInterval) {
      clearInterval(this.checkWindowInterval);
      this.checkWindowInterval = null;
    }
    if (this.authWindowRef && !this.authWindowRef.closed) {
      this.authWindowRef.close();
    }
    this.authWindowRef = null;
  }
}
