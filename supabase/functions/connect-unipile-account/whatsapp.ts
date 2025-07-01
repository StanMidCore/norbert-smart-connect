
import type { ConnectionResponse } from './types.ts';
import { storeWhatsAppChannel } from './database.ts';

export async function handleWhatsAppConnection(
  unipileApiKey: string, 
  supabase: any, 
  userId: string
): Promise<ConnectionResponse> {
  console.log('🔄 DÉBUT Connexion WhatsApp pour user:', userId);
  
  try {
    console.log('📱 Création compte WhatsApp via API Unipile...');
    
    const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        provider: 'WHATSAPP'
      })
    });

    const result = await response.json();
    console.log('📊 Réponse complète API Unipile WhatsApp:', JSON.stringify(result, null, 2));
    console.log('🔍 Status HTTP:', response.status);
    console.log('🔍 Headers reçus:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ Erreur HTTP API Unipile:', response.status, response.statusText);
      console.error('❌ Détails erreur:', JSON.stringify(result, null, 2));
      return {
        success: false,
        error: `Erreur API Unipile (${response.status}): ${result.message || result.detail || JSON.stringify(result)}`
      };
    }

    // Extraction des données de réponse
    const accountId = result.account_id || result.id;
    console.log('🆔 Account ID extrait:', accountId);

    if (accountId) {
      console.log('💾 Sauvegarde du canal WhatsApp en base...');
      await storeWhatsAppChannel(supabase, userId, accountId);
      console.log('✅ Canal WhatsApp sauvegardé');
    } else {
      console.warn('⚠️ Aucun account_id trouvé dans la réponse');
    }

    // Vérification des méthodes de connexion disponibles
    const qrCode = result.checkpoint?.qrcode || result.qr_code || result.qrCode;
    const phoneNumber = result.checkpoint?.phone_number || result.phone_number;
    const smsCode = result.checkpoint?.sms_code || result.sms_code;

    console.log('🔍 Méthodes de connexion disponibles:');
    console.log('  - QR Code:', qrCode ? `Présent (${qrCode.length} chars)` : 'Absent');
    console.log('  - Phone Number:', phoneNumber || 'Absent');
    console.log('  - SMS Code:', smsCode || 'Absent');

    if (qrCode) {
      console.log('✅ QR Code WhatsApp généré avec succès');
      return {
        success: true, 
        qr_code: qrCode,
        account_id: accountId,
        message: 'Scannez le QR code avec WhatsApp'
      };
    } else if (phoneNumber) {
      console.log('📱 Connexion par numéro de téléphone disponible');
      return {
        success: true,
        phone_number: phoneNumber,
        requires_sms: true,
        account_id: accountId,
        message: 'Connexion par numéro de téléphone disponible'
      };
    } else {
      console.error('❌ Aucune méthode de connexion trouvée dans la réponse');
      console.error('📊 Structure complète de la réponse:', JSON.stringify(result, null, 2));
      return {
        success: false,
        error: 'Aucune méthode de connexion WhatsApp disponible. Vérifiez la configuration Unipile.'
      };
    }

  } catch (error) {
    console.error('❌ Erreur CRITIQUE lors de la connexion WhatsApp:', error);
    console.error('📊 Type d\'erreur:', typeof error);
    console.error('📊 Message d\'erreur:', error.message);
    console.error('📊 Stack trace:', error.stack);
    
    return {
      success: false,
      error: `Erreur technique WhatsApp: ${error.message || 'Erreur inconnue'}`
    };
  } finally {
    console.log('🔄 FIN Connexion WhatsApp pour user:', userId);
  }
}
