
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

  // Vérifier les méthodes de connexion disponibles
  const qrCode = result.checkpoint?.qrcode || result.qr_code;
  const phoneNumber = result.checkpoint?.phone_number;
  const smsCode = result.checkpoint?.sms_code;
  
  console.log('🔍 [WhatsApp] Méthodes de connexion disponibles:');
  console.log('📞 [WhatsApp] Phone Number:', phoneNumber ? phoneNumber : 'NON DISPONIBLE');
  console.log('💬 [WhatsApp] SMS Code:', smsCode ? 'DISPONIBLE' : 'NON DISPONIBLE');
  console.log('📱 [WhatsApp] QR Code:', qrCode ? 'DISPONIBLE' : 'NON DISPONIBLE');

  // Prioriser SMS sur QR code pour mobile
  if (phoneNumber) {
    console.log('✅ [WhatsApp] Connexion par SMS pour:', phoneNumber);
    return {
      success: true,
      phone_number: phoneNumber,
      requires_sms: true,
      account_id: accountId,
      message: 'Saisissez le code SMS reçu'
    };
  } else if (qrCode) {
    // QR code en fallback seulement pour desktop
    console.log('✅ [WhatsApp] Retour avec QR Code (longueur:', qrCode.length, ')');
    return {
      success: true, 
      qr_code: qrCode,
      account_id: accountId,
      message: 'Scannez le QR code avec WhatsApp'
    };
  } else {
    // Demander le numéro à l'utilisateur
    console.log('📞 [WhatsApp] Demande de numéro utilisateur');
    return {
      success: true,
      requires_phone_input: true,
      account_id: accountId,
      message: 'Veuillez saisir votre numéro WhatsApp Business'
    };
  }
}
