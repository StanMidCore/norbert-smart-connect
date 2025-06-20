
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
    const { account_id, to, message, channel_type } = await req.json();
    
    if (!account_id || !to || !message) {
      return new Response(JSON.stringify({ 
        error: 'Paramètres manquants: account_id, to, message requis' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const unipileApiKey = 'E/f3wD65./cyZGhVVeFRacYQS7Gjl2qy+PMcVGamxIwDxJQtTuWo=';
    
    const messageData = {
      account_id: account_id,
      to: to,
      body: message,
      type: channel_type === 'email' ? 'email' : 'text'
    };

    console.log('Envoi message via Unipile:', messageData);

    const response = await fetch('https://api2.unipile.com:13279/api/v1/messages', {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Erreur Unipile:', result);
      throw new Error(`Erreur Unipile: ${result.message || 'Erreur inconnue'}`);
    }

    console.log('Message envoyé avec succès:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: result.id,
      unipile_response: result 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
