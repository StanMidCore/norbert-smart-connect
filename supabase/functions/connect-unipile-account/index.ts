
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get demo user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@norbert.ai')
      .single();

    if (userError || !user) {
      console.error('Utilisateur démo non trouvé:', userError);
      return new Response(JSON.stringify({ 
        error: 'Utilisateur non trouvé',
        success: false 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    
    console.log('Connexion compte Unipile pour provider:', provider);

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
        return new Response(JSON.stringify({ 
          success: false,
          error: `Erreur API Unipile: ${result.message || result.detail || 'Erreur inconnue'}`
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Stocker le canal dans notre base de données
      const accountId = result.account_id || result.id;
      if (accountId) {
        const { error: insertError } = await supabase
          .from('channels')
          .upsert({
            user_id: user.id,
            channel_type: 'whatsapp',
            unipile_account_id: accountId,
            status: 'connected',
            connected_at: new Date().toISOString(),
            provider_info: {
              provider: 'WHATSAPP',
              identifier: accountId,
              name: 'WhatsApp Business'
            }
          });

        if (insertError) {
          console.error('Erreur insertion canal:', insertError);
        } else {
          console.log('Canal WhatsApp créé dans la base de données');
        }
      }

      // Pour WhatsApp, on retourne les infos du QR code
      const qrCode = result.checkpoint?.qrcode || result.qr_code;
      if (!qrCode) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'QR code non disponible dans la réponse Unipile'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        qr_code: qrCode,
        account_id: accountId,
        message: 'Scannez le QR code avec WhatsApp'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mapping des providers vers les noms attendus par Unipile
    const providerMapping: { [key: string]: string } = {
      'gmail': 'GOOGLE',
      'outlook': 'OUTLOOK', 
      'facebook': 'MESSENGER',
      'instagram': 'INSTAGRAM'
    };

    const unipileProvider = providerMapping[provider.toLowerCase()];
    if (!unipileProvider) {
      return new Response(JSON.stringify({ 
        error: `Provider ${provider} non supporté`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pour les providers OAuth (Gmail, Outlook, Facebook), on utilise l'API d'autorisation hébergée
    if (['gmail', 'outlook', 'facebook'].includes(provider.toLowerCase())) {
      console.log('Utilisation de l\'API d\'autorisation hébergée pour:', provider);
      
      // Utiliser l'origin de la requête ou l'URL par défaut pour les redirections
      const origin = req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co';
      
      // Calculer la date d'expiration (24h à partir de maintenant)
      const expiresOn = new Date();
      expiresOn.setHours(expiresOn.getHours() + 24);
      
      const authResponse = await fetch('https://api2.unipile.com:13279/api/v1/hosted/accounts/link', {
        method: 'POST',
        headers: {
          'X-API-KEY': unipileApiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          type: "create",
          providers: [unipileProvider],
          expiresOn: expiresOn.toISOString(),
          api_url: "https://api2.unipile.com:13279",
          // Utiliser un callback spécial pour les popups au lieu de redirections dans la même fenêtre
          success_redirect_url: `${origin}/oauth-callback?connection=success&provider=${provider}`,
          failure_redirect_url: `${origin}/oauth-callback?connection=failed&provider=${provider}`
        })
      });

      const authResult = await authResponse.json();
      console.log('Réponse Unipile auth:', authResult);

      if (!authResponse.ok) {
        console.error('Erreur API Unipile Auth:', authResult);
        return new Response(JSON.stringify({ 
          success: false,
          error: `Erreur API Unipile Auth: ${authResult.message || authResult.detail || 'Erreur inconnue'}`
        }), {
          status: authResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const authUrl = authResult.link || authResult.url;
      if (!authUrl) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'URL d\'autorisation non disponible'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Retourner l'URL d'autorisation pour ouverture en popup (pas de redirection)
      return new Response(JSON.stringify({ 
        success: true, 
        authorization_url: authUrl,
        message: 'URL d\'autorisation générée pour popup'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pour Instagram (nécessite username/password)
    if (provider.toLowerCase() === 'instagram') {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Instagram nécessite une configuration manuelle via le dashboard Unipile.',
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
