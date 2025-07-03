
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
    const { account_id, phone_number, verification_code, action } = await req.json();
    
    if (!account_id) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Account ID requis' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Unipile API key
    const unipileApiKey = Deno.env.get('UNIPILE_API_KEY');
    
    if (!unipileApiKey) {
      console.error('Clé API Unipile manquante');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Configuration manquante: clé API Unipile' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔄 [WhatsApp SMS] Action: ${action} pour account: ${account_id}`);

    if (action === 'send_code' && phone_number) {
      // Envoyer le code SMS via Unipile
      console.log(`📱 [WhatsApp SMS] Envoi code vers: ${phone_number}`);
      
      const response = await fetch(`https://api2.unipile.com:13279/api/v1/accounts/${account_id}/send_code`, {
        method: 'POST',
        headers: {
          'X-API-KEY': unipileApiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          phone_number: phone_number
        })
      });

      const result = await response.json();
      console.log(`📊 [WhatsApp SMS] Réponse envoi code:`, result);

      if (!response.ok) {
        console.error(`❌ [WhatsApp SMS] Erreur envoi:`, result);
        return new Response(JSON.stringify({
          success: false,
          error: result.message || result.detail || 'Erreur envoi SMS'
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Code SMS envoyé'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'verify_code' && verification_code) {
      // Vérifier le code SMS via Unipile
      console.log(`🔐 [WhatsApp SMS] Vérification code pour account: ${account_id}`);
      
      const response = await fetch(`https://api2.unipile.com:13279/api/v1/accounts/${account_id}/verify_code`, {
        method: 'POST',
        headers: {
          'X-API-KEY': unipileApiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          verification_code: verification_code
        })
      });

      const result = await response.json();
      console.log(`📊 [WhatsApp SMS] Réponse vérification:`, result);

      if (!response.ok) {
        console.error(`❌ [WhatsApp SMS] Erreur vérification:`, result);
        return new Response(JSON.stringify({
          success: false,
          error: result.message || result.detail || 'Code de vérification invalide'
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'WhatsApp connecté avec succès',
        account_status: result.status || 'connected'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Action non supportée ou paramètres manquants'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Erreur vérification WhatsApp SMS:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Erreur serveur'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
