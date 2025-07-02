
import type { ConnectionResponse } from './types.ts';
import { storeWhatsAppChannel } from './database.ts';

export async function handleWhatsAppConnection(
  unipileApiKey: string, 
  supabase: any, 
  userId: string
): Promise<ConnectionResponse> {
  console.log('🔄 [WhatsApp] Début de la connexion pour userId:', userId);
  console.log('🔄 [WhatsApp] Appel API Unipile pour création compte...');
  
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
  console.log('📊 [WhatsApp] Réponse Unipile complète:', JSON.stringify(result, null, 2));
  console.log('📊 [WhatsApp] Status code:', response.status);

  if (!response.ok) {
    console.error('❌ [WhatsApp] Erreur API Unipile:', result);
    console.error('❌ [WhatsApp] Headers de réponse:', Object.fromEntries(response.headers.entries()));
    return {
      success: false,
      error: `Erreur API Unipile: ${result.message || result.detail || 'Erreur inconnue'}`
    };
  }

  const accountId = result.account_id || result.id;
  console.log('🔑 [WhatsApp] Account ID trouvé:', accountId);
  
  if (accountId) {
    console.log('💾 [WhatsApp] Stockage en base de données...');
    await storeWhatsAppChannel(supabase, userId, accountId);
    console.log('✅ [WhatsApp] Canal stocké en base');
  } else {
    console.warn('⚠️ [WhatsApp] Aucun account ID trouvé dans la réponse');
  }

  // Vérifier si on a un QR code ou une autre méthode
  const qrCode = result.checkpoint?.qrcode || result.qr_code;
  const phoneNumber = result.checkpoint?.phone_number;
  const smsCode = result.checkpoint?.sms_code;
  
  console.log('🔍 [WhatsApp] Méthodes de connexion disponibles:');
  console.log('📱 [WhatsApp] QR Code:', qrCode ? 'DISPONIBLE' : 'NON DISPONIBLE');
  console.log('📞 [WhatsApp] Phone Number:', phoneNumber ? phoneNumber : 'NON DISPONIBLE');
  console.log('💬 [WhatsApp] SMS Code:', smsCode ? 'DISPONIBLE' : 'NON DISPONIBLE');

  if (qrCode) {
    console.log('✅ [WhatsApp] Retour avec QR Code (longueur:', qrCode.length, ')');
    return {
      success: true, 
      qr_code: qrCode,
      account_id: accountId,
      message: 'Scannez le QR code avec WhatsApp'
    };
  } else if (phoneNumber) {
    console.log('✅ [WhatsApp] Retour avec connexion SMS pour:', phoneNumber);
    return {
      success: true,
      phone_number: phoneNumber,
      requires_sms: true,
      account_id: accountId,
      message: 'Connexion par numéro de téléphone disponible'
    };
  } else {
    console.error('❌ [WhatsApp] Aucune méthode de connexion trouvée');
    return {
      success: false,
      error: 'Aucune méthode de connexion disponible'
    };
  }
}
