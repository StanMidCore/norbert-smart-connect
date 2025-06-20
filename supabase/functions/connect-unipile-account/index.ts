
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

    // Préparer les paramètres selon le provider
    let requestBody;
    
    switch (provider.toLowerCase()) {
      case 'whatsapp':
        requestBody = {
          provider: 'WHATSAPP'
        };
        break;
        
      case 'gmail':
        requestBody = {
          provider: 'GMAIL'
        };
        break;
        
      case 'outlook':
        requestBody = {
          provider: 'OUTLOOK'
        };
        break;
        
      case 'instagram':
        requestBody = {
          provider: 'INSTAGRAM',
          username: '', // L'utilisateur devra fournir ces infos
          password: ''  // Nous allons retourner une URL pour qu'il les saisisse
        };
        break;
        
      case 'facebook':
        requestBody = {
          provider: 'FACEBOOK'
        };
        break;
        
      default:
        throw new Error(`Provider ${provider} non supporté`);
    }

    console.log('Corps de la requête:', requestBody);

    // Pour les providers OAuth (Gmail, Outlook, Facebook), on utilise l'API d'autorisation
    if (['gmail', 'outlook', 'facebook'].includes(provider.toLowerCase())) {
      const authResponse = await fetch('https://api2.unipile.com:13279/api/v1/hosted/accounts/link', {
        method: 'POST',
        headers: {
          'X-API-KEY': unipileApiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          providers: [provider.toUpperCase()],
          success_callback_url: `${req.headers.get('origin')}/channels?success=true`,
          error_callback_url: `${req.headers.get('origin')}/channels?error=connection_failed`
        })
      });

      const authResult = await response.json();
      console.log('Réponse Unipile auth:', authResult);

      if (!authResponse.ok) {
        throw new Error(`Erreur API Unipile Auth: ${authResult.message || 'Erreur inconnue'}`);
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
    const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();
    console.log('Réponse Unipile connexion:', result);

    if (!response.ok) {
      throw new Error(`Erreur API Unipile: ${result.message || result.detail || 'Erreur inconnue'}`);
    }

    // Pour WhatsApp, on retourne les infos du QR code
    if (provider.toLowerCase() === 'whatsapp') {
      return new Response(JSON.stringify({ 
        success: true, 
        qr_code: result.qr_code,
        account_id: result.id,
        message: 'Scannez le QR code avec WhatsApp'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      account_id: result.id,
      message: 'Compte connecté avec succès'
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
