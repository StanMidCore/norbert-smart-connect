
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './constants.ts';
import { getCurrentUser } from './database.ts';
import { handleWhatsAppConnection } from './whatsapp.ts';
import { handleOAuthConnection } from './oauth.ts';
import type { ConnectionResponse } from './types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 DÉBUT Connexion compte Unipile...');

  try {
    const { provider } = await req.json();
    console.log('📋 Provider demandé:', provider);
    
    if (!provider) {
      console.error('❌ Provider manquant');
      return new Response(JSON.stringify({ 
        error: 'Provider requis',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current user and database connection
    console.log('👤 Récupération utilisateur actuel...');
    const { user, supabase } = await getCurrentUser();
    console.log('✅ Utilisateur trouvé:', user.email);

    // Get Unipile API key with better error handling
    const unipileApiKey = Deno.env.get('UNIPILE_API_KEY');
    console.log('🔑 Vérification clé API Unipile:', unipileApiKey ? 'Présente' : 'Absente');
    
    if (!unipileApiKey) {
      console.error('❌ Clé API Unipile manquante dans les secrets');
      return new Response(JSON.stringify({ 
        error: 'Configuration manquante: clé API Unipile non configurée. Veuillez vérifier vos secrets Supabase.',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test the API key with a simple request
    console.log('🧪 Test de la clé API Unipile...');
    try {
      const testResponse = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
        method: 'GET',
        headers: {
          'X-API-KEY': unipileApiKey,
          'accept': 'application/json'
        }
      });
      
      console.log('📊 Test API - Status:', testResponse.status);
      
      if (!testResponse.ok) {
        const errorData = await testResponse.json().catch(() => ({}));
        console.error('❌ Erreur test API Unipile:', {
          status: testResponse.status,
          statusText: testResponse.statusText,
          error: errorData
        });
        
        return new Response(JSON.stringify({ 
          error: `Clé API Unipile invalide (${testResponse.status}): ${errorData.title || testResponse.statusText}`,
          success: false 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('✅ Clé API Unipile valide');
    } catch (apiTestError) {
      console.error('❌ Erreur réseau test API:', apiTestError);
      return new Response(JSON.stringify({ 
        error: 'Impossible de contacter l\'API Unipile. Vérifiez votre connexion internet.',
        success: false 
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`🔌 Connexion compte Unipile pour provider: ${provider}`);

    let result: ConnectionResponse;

    // Handle different providers
    const providerLower = provider.toLowerCase();
    
    if (providerLower === 'whatsapp') {
      console.log('📱 Traitement WhatsApp...');
      result = await handleWhatsAppConnection(unipileApiKey, supabase, user.id);
    } else if (['gmail', 'outlook', 'instagram'].includes(providerLower)) {
      console.log(`📧 Traitement OAuth ${provider}...`);
      result = await handleOAuthConnection(provider, unipileApiKey, supabase, user.id);
    } else {
      console.error('❌ Provider non supporté:', provider);
      result = {
        success: false,
        error: `Provider ${provider} non supporté`
      };
    }

    console.log('📋 Résultat final:', result.success ? 'SUCCÈS' : 'ÉCHEC');
    if (!result.success) {
      console.error('❌ Détails erreur:', result.error);
    }

    // Return response
    const statusCode = result.success ? 200 : 400;
    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erreur CRITIQUE connexion compte Unipile:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: typeof error
    });
    
    return new Response(JSON.stringify({ 
      error: `Erreur technique: ${error.message || 'Erreur inconnue'}`,
      details: error.name || 'Type inconnu',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    console.log('🔄 FIN Connexion compte Unipile');
  }
});
