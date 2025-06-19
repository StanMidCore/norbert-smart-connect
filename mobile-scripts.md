
# Scripts Mobile

Une fois le projet exporté vers GitHub, vous pourrez utiliser ces commandes :

```bash
# Installation des dépendances
npm install

# Ajout des plateformes natives
npx cap add ios
npx cap add android

# Build de l'application
npm run build

# Synchronisation avec les plateformes natives
npx cap sync

# Lancement sur les émulateurs/devices
npx cap run android
npx cap run ios
```

## Configuration post-export

Après avoir exporté vers GitHub :

1. **Pour Android** : Installer Android Studio
2. **Pour iOS** : Utiliser un Mac avec Xcode installé
3. **Hot reload** : L'URL dans capacitor.config.ts permet le hot reload depuis le sandbox

## Fonctionnalités natives disponibles

- Notifications push
- Accès aux contacts (pour l'intégration client)
- Géolocalisation
- Appareil photo (pour les photos de chantier)
- Stockage local sécurisé
