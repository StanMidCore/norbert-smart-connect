
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const unipileApiKey = 'E/f3wD65./cyZGhVVeFRacYQS7Gjl2qy+PMcVGamxIwDxJQtTuWo=';
    
    console.log('Récupération des comptes Unipile...');

    const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
      method: 'GET',
      headers: {
        'X-API-KEY': unipileApiKey,
        'accept': 'application/json'
      }
    });

    const accounts = await response.json();
    console.log('Comptes Unipile récupérés:', accounts);

    if (!response.ok) {
      throw new Error(`Erreur API Unipile: ${accounts.message || 'Erreur inconnue'}`);
    }

    // Transformation des comptes au format Norbert
    const norbertChannels = accounts.map((account: any) => ({
      id: account.id,
      unipile_account_id: account.id,
      channel_type: mapUnipileToChannelType(account.provider),
      status: account.is_active ? 'connected' : 'disconnected',
      provider_info: {
        provider: account.provider,
        identifier: account.identifier,
        name: account.name || account.identifier
      }
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      accounts: accounts,
      norbert_channels: norbertChannels 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur récupération comptes Unipile:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function mapUnipileToChannelType(provider: string): string {
  const mapping: { [key: string]: string } = {
    'whatsapp': 'whatsapp',
    'gmail': 'email',
    'outlook': 'email',
    'instagram': 'instagram',
    'facebook': 'facebook',
    'linkedin': 'linkedin'
  };
  
  return mapping[provider.toLowerCase()] || 'unknown';
}
