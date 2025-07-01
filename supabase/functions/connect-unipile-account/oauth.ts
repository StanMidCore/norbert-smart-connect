
import type { ConnectionResponse } from './types.ts';
import { storeEmailChannel, storeInstagramChannel } from './database.ts';

const OAUTH_PROVIDERS = {
  GMAIL: 'GOOGLE_OAUTH',
  OUTLOOK: 'OUTLOOK',
  INSTAGRAM: 'INSTAGRAM'
};

export async function handleOAuthConnection(
  provider: string,
  unipileApiKey: string,
  supabase: any,
  userId: string
): Promise<ConnectionResponse> {
  console.log(`🔄 DÉBUT Connexion OAuth ${provider} pour user:`, userId);
  
  try {
    const unipileProvider = OAUTH_PROVIDERS[provider.toUpperCase()];
    if (!unipileProvider) {
      console.error('❌ Provider non supporté:', provider);
      return {
        success: false,
        error: `Provider ${provider} non supporté`
      };
    }

    console.log(`🔗 Création compte ${provider} via API Unipile...`);
    console.log(`📊 Provider Unipile utilisé:`, unipileProvider);
    
    const requestBody = {
      provider: unipileProvider
    };

    console.log('📤 Corps de la requête:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log(`📊 Réponse complète API Unipile ${provider}:`, JSON.stringify(result, null, 2));
    console.log('🔍 Status HTTP:', response.status);

    if (!response.ok) {
      console.error(`❌ Erreur HTTP API Unipile ${provider}:`, response.status, response.statusText);
      console.error('❌ Détails erreur:', JSON.stringify(result, null, 2));
      
      return {
        success: false,
        error: `Erreur API Unipile ${provider} (${response.status}): ${result.message || result.detail || JSON.stringify(result)}`
      };
    }

    // Extraction des données de réponse
    const accountId = result.account_id || result.id;
    const authUrl = result.authorization_url || result.auth_url;
    
    console.log(`🆔 Account ID ${provider}:`, accountId);
    console.log(`🔗 URL d'autorisation ${provider}:`, authUrl ? 'Présente' : 'Absente');

    if (accountId) {
      if (provider.toUpperCase() === 'GMAIL' || provider.toUpperCase() === 'OUTLOOK') {
        console.log(`💾 Sauvegarde du canal email ${provider} en base...`);
        await storeEmailChannel(supabase, userId, accountId, provider.toLowerCase());
        console.log(`✅ Canal ${provider} sauvegardé`);
      } else if (provider.toUpperCase() === 'INSTAGRAM') {
        console.log('💾 Sauvegarde du canal Instagram en base...');
        await storeInstagramChannel(supabase, userId, accountId);
        console.log('✅ Canal Instagram sauvegardé');
      }
    } else {
      console.warn(`⚠️ Aucun account_id trouvé dans la réponse ${provider}`);
    }

    if (authUrl) {
      console.log(`✅ URL d'autorisation ${provider} générée avec succès`);
      return {
        success: true,
        authorization_url: authUrl,
        account_id: accountId,
        message: `Autorisez l'accès à ${provider} dans la nouvelle fenêtre`
      };
    } else {
      console.error(`❌ Aucune URL d'autorisation trouvée pour ${provider}`);
      console.error('📊 Structure complète de la réponse:', JSON.stringify(result, null, 2));
      return {
        success: false,
        error: `URL d'autorisation ${provider} non disponible. Vérifiez la configuration Unipile.`
      };
    }

  } catch (error) {
    console.error(`❌ Erreur CRITIQUE lors de la connexion ${provider}:`, error);
    console.error('📊 Type d\'erreur:', typeof error);
    console.error('📊 Message d\'erreur:', error.message);
    console.error('📊 Stack trace:', error.stack);
    
    return {
      success: false,
      error: `Erreur technique ${provider}: ${error.message || 'Erreur inconnue'}`
    };
  } finally {
    console.log(`🔄 FIN Connexion OAuth ${provider} pour user:`, userId);
  }
}
