
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
    // Récupération de la clé API depuis les secrets Supabase
    const unipileApiKey = Deno.env.get('UNIPILE_API_KEY');
    if (!unipileApiKey) {
      console.error('Clé API Unipile manquante dans les secrets');
      return new Response(JSON.stringify({ 
        error: 'Configuration manquante: clé API Unipile non configurée',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('Récupération des comptes Unipile...');
    console.log('Clé API présente:', unipileApiKey ? 'Oui' : 'Non');

    const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
      method: 'GET',
      headers: {
        'X-API-KEY': unipileApiKey,
        'accept': 'application/json'
      }
    });

    const accountsData = await response.json();
    console.log('Réponse Unipile complète:', accountsData);

    if (!response.ok) {
      console.error('Erreur API Unipile:', accountsData);
      throw new Error(`Erreur API Unipile: ${accountsData.message || accountsData.detail || 'Erreur inconnue'}`);
    }

    // Extraire le tableau d'accounts depuis la structure de réponse Unipile
    const accounts = accountsData.items || [];
    console.log('Comptes extraits:', accounts);

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

    console.log('Canaux Norbert générés:', norbertChannels);

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
