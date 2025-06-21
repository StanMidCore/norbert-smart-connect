
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

    // IMPORTANTE: Utilisez votre vraie clé API Unipile ici
    const unipileApiKey = Deno.env.get('UNIPILE_API_KEY') || 'YOUR_REAL_UNIPILE_API_KEY_HERE';
    
    console.log('Connexion compte Unipile pour provider:', provider);

    // Pour les providers OAuth (Gmail, Outlook, Facebook), on utilise l'API d'autorisation hébergée
    if (['gmail', 'outlook', 'facebook'].includes(provider.toLowerCase())) {
      console.log('Utilisation de l\'API d\'autorisation hébergée pour:', provider);
      
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      
      const authResponse = await fetch('https://api2.unipile.com:13279/api/v1/hosted/accounts/link', {
        method: 'POST',
        headers: {
          'X-API-KEY': unipileApiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          providers: [provider.toUpperCase()],
          success_callback_url: `${origin}/channels?success=true`,
          error_callback_url: `${origin}/channels?error=connection_failed`
        })
      });

      const authResult = await authResponse.json();
      console.log('Réponse Unipile auth:', authResult);

      if (!authResponse.ok) {
        console.error('Erreur API Unipile Auth:', authResult);
        throw new Error(`Erreur API Unipile Auth: ${authResult.message || authResult.detail || 'Erreur inconnue'}`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        authorization_url: authResult.link,
        message: 'Redirection vers l\'autorisation en cours...'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pour WhatsApp, on utilise l'API normale qui va retourner un QR code
    if (provider.toLowerCase() === 'whatsapp') {
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
        throw new Error(`Erreur API Unipile: ${result.message || result.detail || 'Erreur inconnue'}`);
      }

      // Pour WhatsApp, on retourne les infos du QR code
      return new Response(JSON.stringify({ 
        success: true, 
        qr_code: result.checkpoint?.qrcode || result.qr_code,
        account_id: result.account_id || result.id,
        message: 'Scannez le QR code avec WhatsApp'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pour Instagram (nécessite username/password)
    if (provider.toLowerCase() === 'instagram') {
      // Pour Instagram, on retourne une URL pour que l'utilisateur saisisse ses identifiants
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Instagram nécessite une configuration manuelle. Veuillez vous connecter via le dashboard Unipile.',
        requires_manual_setup: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: `Provider ${provider} non supporté pour la connexion automatique`
    }), {
      status: 400,
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
