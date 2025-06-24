
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, providerMapping } from './constants.ts';
import { getDemoUser } from './database.ts';
import { handleWhatsAppConnection } from './whatsapp.ts';
import { handleOAuthConnection } from './oauth.ts';
import type { ConnectionResponse } from './types.ts';

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

    // Get demo user and database connection
    const { user, supabase } = await getDemoUser();

    // Get Unipile API key
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

    let result: ConnectionResponse;

    // Handle WhatsApp connection
    if (provider.toLowerCase() === 'whatsapp') {
      result = await handleWhatsAppConnection(unipileApiKey, supabase, user.id);
    }
    // Handle OAuth providers (Gmail, Outlook, Facebook)
    else if (['gmail', 'outlook', 'facebook'].includes(provider.toLowerCase())) {
      const unipileProvider = providerMapping[provider.toLowerCase()];
      const origin = req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co';
      
      result = await handleOAuthConnection(provider, unipileProvider, unipileApiKey, origin);
    }
    // Handle Instagram
    else if (provider.toLowerCase() === 'instagram') {
      result = {
        success: false,
        error: 'Instagram nécessite une configuration manuelle via le dashboard Unipile.',
        requires_manual_setup: true
      };
    }
    // Handle unsupported providers
    else {
      const unipileProvider = providerMapping[provider.toLowerCase()];
      if (!unipileProvider) {
        result = {
          success: false,
          error: `Provider ${provider} non supporté`
        };
      } else {
        result = {
          success: false,
          error: `Provider ${provider} non supporté pour la connexion automatique`
        };
      }
    }

    // Return response
    const statusCode = result.success ? 200 : (result.requires_manual_setup ? 400 : 400);
    return new Response(JSON.stringify(result), {
      status: statusCode,
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
