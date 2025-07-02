
import type { ConnectionResponse } from './types.ts';
import { storeWhatsAppChannel } from './database.ts';

export async function handleWhatsAppConnection(
  unipileApiKey: string, 
  supabase: any, 
  userId: string
): Promise<ConnectionResponse> {
  console.log('Création compte WhatsApp...');
  
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
  console.log('Réponse Unipile WhatsApp:', result);

  if (!response.ok) {
    console.error('Erreur API Unipile:', result);
    return {
      success: false,
      error: `Erreur API Unipile: ${result.message || result.detail || 'Erreur inconnue'}`
    };
  }

  const accountId = result.account_id || result.id;
  if (accountId) {
    await storeWhatsAppChannel(supabase, userId, accountId);
  }

  // Vérifier si on a un QR code ou une autre méthode
  const qrCode = result.checkpoint?.qrcode || result.qr_code;
  const phoneNumber = result.checkpoint?.phone_number;
  const smsCode = result.checkpoint?.sms_code;

  if (qrCode) {
    return {
      success: true, 
      qr_code: qrCode,
      account_id: accountId,
      message: 'Scannez le QR code avec WhatsApp'
    };
  } else if (phoneNumber) {
    return {
      success: true,
      phone_number: phoneNumber,
      requires_sms: true,
      account_id: accountId,
      message: 'Connexion par numéro de téléphone disponible'
    };
  } else {
    return {
      success: false,
      error: 'Aucune méthode de connexion disponible'
    };
  }
}
