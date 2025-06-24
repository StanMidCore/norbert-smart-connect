
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

  const qrCode = result.checkpoint?.qrcode || result.qr_code;
  if (!qrCode) {
    return {
      success: false,
      error: 'QR code non disponible dans la réponse Unipile'
    };
  }

  return {
    success: true, 
    qr_code: qrCode,
    account_id: accountId,
    message: 'Scannez le QR code avec WhatsApp'
  };
}
