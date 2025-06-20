
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
    const { provider } = await req.json();
    
    if (!provider) {
      return new Response(JSON.stringify({ 
        error: 'Provider requis' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const unipileApiKey = 'E/f3wD65./cyZGhVVeFRacYQS7Gjl2qy+PMcVGamxIwDxJQtTuWo=';
    
    console.log('Connexion compte Unipile pour provider:', provider);

    // Créer une demande de connexion de compte
    const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        provider: provider,
        // URL de callback après autorisation (optionnel)
        success_callback_url: `${req.headers.get('origin')}/channels`,
        error_callback_url: `${req.headers.get('origin')}/channels?error=connection_failed`
      })
    });

    const result = await response.json();
    console.log('Réponse Unipile connexion:', result);

    if (!response.ok) {
      throw new Error(`Erreur API Unipile: ${result.message || 'Erreur inconnue'}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      authorization_url: result.authorization_url,
      account_id: result.id,
      message: 'Redirection vers l\'autorisation en cours...'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur connexion compte Unipile:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
