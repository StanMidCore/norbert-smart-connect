
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.235835adb9ee4b6383510811f7f478c7',
  appName: 'norbert-smart-connect',
  webDir: 'dist',
  server: {
    url: 'https://235835ad-b9ee-4b63-8351-0811f7f478c7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A3C64',
      showSpinner: false
    }
  }
};

export default config;
