
import type { ConnectionResponse, UnipileAuthRequest } from './types.ts';

export async function handleOAuthConnection(
  provider: string,
  unipileProvider: string,
  unipileApiKey: string,
  origin: string
): Promise<ConnectionResponse> {
  
  // Pour Gmail, utiliser l'OAuth personnalisé avec les credentials Google
  if (provider.toLowerCase() === 'gmail') {
    console.log('Utilisation OAuth personnalisé Google pour Gmail');
    
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    if (!googleClientId || !googleClientSecret) {
      return {
        success: false,
        error: 'Configuration Google OAuth manquante. Veuillez configurer GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET.'
      };
    }
    
    // Utiliser l'API Unipile avec les credentials personnalisés - format corrigé
    const authRequest = {
      provider: 'GOOGLE',
      client_id: googleClientId,
      client_secret: googleClientSecret,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      redirect_uri: `${origin}/oauth-callback?connection=success&provider=gmail`
    };

    console.log('Requête OAuth Google:', JSON.stringify(authRequest, null, 2));

    const authResponse = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(authRequest)
    });

    const authResult = await authResponse.json();
    console.log('Réponse Unipile OAuth personnalisé:', authResult);

    if (!authResponse.ok) {
      console.error('Erreur API Unipile OAuth personnalisé:', authResult);
      return {
        success: false,
        error: `Erreur OAuth Google: ${authResult.message || authResult.detail || 'Erreur inconnue'}`
      };
    }

    const authUrl = authResult.authorization_url || authResult.auth_url || authResult.url;
    if (!authUrl) {
      return {
        success: false,
        error: 'URL d\'autorisation Google non disponible'
      };
    }

    return {
      success: true, 
      authorization_url: authUrl,
      message: 'OAuth Google personnalisé configuré'
    };
  }
  
  // Pour les autres providers (Outlook, Facebook), utiliser l'API hébergée
  console.log('Utilisation de l\'API d\'autorisation hébergée pour:', provider);
  
  // Calculer la date d'expiration (24h à partir de maintenant)
  const expiresOn = new Date();
  expiresOn.setHours(expiresOn.getHours() + 24);
  
  const authRequest: UnipileAuthRequest = {
    type: "create",
    providers: [unipileProvider],
    expiresOn: expiresOn.toISOString(),
    api_url: "https://api2.unipile.com:13279",
    success_redirect_url: `${origin}/oauth-callback?connection=success&provider=${provider}`,
    failure_redirect_url: `${origin}/oauth-callback?connection=failed&provider=${provider}`
  };

  const authResponse = await fetch('https://api2.unipile.com:13279/api/v1/hosted/accounts/link', {
    method: 'POST',
    headers: {
      'X-API-KEY': unipileApiKey,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify(authRequest)
  });

  const authResult = await authResponse.json();
  console.log('Réponse Unipile auth:', authResult);

  if (!authResponse.ok) {
    console.error('Erreur API Unipile Auth:', authResult);
    return {
      success: false,
      error: `Erreur API Unipile Auth: ${authResult.message || authResult.detail || 'Erreur inconnue'}`
    };
  }

  const authUrl = authResult.link || authResult.url;
  if (!authUrl) {
    return {
      success: false,
      error: 'URL d\'autorisation non disponible'
    };
  }

  return {
    success: true, 
    authorization_url: authUrl,
    message: 'URL d\'autorisation générée pour popup'
  };
}
