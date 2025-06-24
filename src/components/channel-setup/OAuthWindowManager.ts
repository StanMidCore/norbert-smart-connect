
import { WindowConfiguration } from './utils/WindowConfiguration';
import { WindowMonitor, ToastFunction } from './utils/WindowMonitor';

export class OAuthWindowManager {
  private authWindowRef: Window | null = null;
  private windowMonitor = new WindowMonitor();

  startWindowMonitoring(
    authWindow: Window, 
    provider: string, 
    onComplete: () => void,
    onToast: ToastFunction
  ): void {
    this.windowMonitor.startMonitoring(authWindow, provider, onComplete, onToast);
  }

  openAuthWindow(url: string, provider: string): Window | null {
    // Fermer la fenêtre précédente si elle existe
    if (this.authWindowRef && !this.authWindowRef.closed) {
      this.authWindowRef.close();
    }
    
    // Calculer la position centrée
    const config = WindowConfiguration.getPopupConfig();
    const features = WindowConfiguration.buildWindowFeatures(config);
    
    try {
      // Ouvrir dans une nouvelle fenêtre popup
      const authWindow = window.open(
        url,
        `oauth-${provider}-${Date.now()}`,
        features
      );
      
      if (authWindow) {
        this.authWindowRef = authWindow;
        authWindow.focus();
        
        // Ajouter un gestionnaire d'erreur pour débloquer l'interface
        authWindow.onerror = () => {
          console.log(`❌ Erreur dans la fenêtre ${provider}`);
          this.cleanup();
        };
      }
      
      return authWindow;
    } catch (error) {
      console.error(`❌ Erreur ouverture fenêtre ${provider}:`, error);
      return null;
    }
  }

  cleanup(): void {
    this.windowMonitor.cleanup();
    if (this.authWindowRef && !this.authWindowRef.closed) {
      try {
        this.authWindowRef.close();
      } catch (error) {
        console.log('Erreur fermeture fenêtre:', error);
      }
    }
    this.authWindowRef = null;
  }
}
