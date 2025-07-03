
import type { ConnectionResponse } from './types.ts';

export async function handleInstagramConnection(
  unipileApiKey: string, 
  supabase: any, 
  userId: string
): Promise<ConnectionResponse> {
  console.log('🔄 [Instagram] Début de la connexion pour userId:', userId);
  console.log('🔄 [Instagram] Tentative de création compte Instagram...');
  
  try {
    const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        provider: 'INSTAGRAM'
      })
    });

    const result = await response.json();
    console.log('📊 [Instagram] Réponse Unipile complète:', JSON.stringify(result, null, 2));
    console.log('📊 [Instagram] Status code:', response.status);
    console.log('📊 [Instagram] Headers de réponse:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ [Instagram] Erreur API Unipile:', result);
      console.error('❌ [Instagram] Status détaillé:', response.status, response.statusText);
      console.error('❌ [Instagram] Body de la réponse:', result);
      
      // Logging détaillé des erreurs
      if (result.detail) {
        console.error('❌ [Instagram] Détail de l\'erreur:', result.detail);
      }
      if (result.message) {
        console.error('❌ [Instagram] Message d\'erreur:', result.message);
      }
      if (result.code) {
        console.error('❌ [Instagram] Code d\'erreur:', result.code);
      }
      
      // Instagram nécessite souvent une configuration manuelle
      if (result.detail?.includes('configuration') || 
          result.message?.includes('manual') || 
          result.detail?.includes('not supported') ||
          response.status === 400) {
        console.log('⚠️ [Instagram] Configuration manuelle ou non supporté détectée');
        return {
          success: false,
          error: `Instagram: ${result.message || result.detail || 'Configuration manuelle requise'}. Statut: ${response.status}`,
          requires_manual_setup: true
        };
      }
      
      return {
        success: false,
        error: `Erreur API Instagram (${response.status}): ${result.message || result.detail || 'Erreur inconnue'}`
      };
    }

    const accountId = result.account_id || result.id;
    console.log('🔑 [Instagram] Account ID trouvé:', accountId);
    
    if (accountId) {
      console.log('💾 [Instagram] Stockage en base de données...');
      // Stocker le canal Instagram
      const { error: insertError } = await supabase
        .from('channels')
        .upsert({
          user_id: userId,
          channel_type: 'instagram',
          unipile_account_id: accountId,
          status: 'connected',
          connected_at: new Date().toISOString(),
          provider_info: {
            provider: 'INSTAGRAM',
            identifier: accountId,
            name: 'Instagram'
          }
        });

      if (insertError) {
        console.error('❌ [Instagram] Erreur insertion canal:', insertError);
      } else {
        console.log('✅ [Instagram] Canal stocké en base');
      }
    } else {
      console.warn('⚠️ [Instagram] Aucun account ID trouvé dans la réponse');
    }

    // Instagram utilise généralement OAuth
    const authUrl = result.authorization_url || result.auth_url || result.redirect_url;
    const loginUrl = result.login_url;
    
    console.log('🔍 [Instagram] Vérification méthodes de connexion:');
    console.log('🔗 [Instagram] Auth URL:', authUrl ? 'DISPONIBLE' : 'NON DISPONIBLE');
    console.log('🔗 [Instagram] Login URL:', loginUrl ? 'DISPONIBLE' : 'NON DISPONIBLE');
    
    if (authUrl) {
      console.log('✅ [Instagram] Retour avec URL d\'autorisation:', authUrl);
      return {
        success: true,
        authorization_url: authUrl,
        account_id: accountId,
        message: 'Autorisez l\'accès à Instagram dans la nouvelle fenêtre'
      };
    } else if (loginUrl) {
      console.log('✅ [Instagram] Retour avec URL de login:', loginUrl);
      return {
        success: true,
        authorization_url: loginUrl,
        account_id: accountId,
        message: 'Connectez-vous à Instagram dans la nouvelle fenêtre'
      };
    } else {
      console.error('❌ [Instagram] Aucune méthode de connexion trouvée');
      console.log('🔍 [Instagram] Clés disponibles dans result:', Object.keys(result));
      return {
        success: false,
        error: 'Instagram: Aucune URL d\'autorisation disponible. Contactez le support.',
        requires_manual_setup: true
      };
    }

  } catch (error) {
    console.error('❌ [Instagram] Erreur CRITIQUE lors de la connexion:', error);
    console.error('❌ [Instagram] Stack trace:', error.stack);
    return {
      success: false,
      error: `Erreur de connexion Instagram: ${error.message}`,
      requires_manual_setup: true
    };
  }
}
