
import type { ConnectionResponse, UnipileAuthRequest } from './types.ts';

export async function handleOAuthConnection(
  provider: string,
  unipileProvider: string,
  unipileApiKey: string,
  origin: string
): Promise<ConnectionResponse> {
  
  // Utiliser l'API d'autorisation hébergée pour tous les providers OAuth
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

  console.log('Requête OAuth hébergée:', JSON.stringify(authRequest, null, 2));

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
  console.log('Réponse Unipile auth hébergée:', authResult);

  if (!authResponse.ok) {
    console.error('Erreur API Unipile Auth hébergée:', authResult);
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
