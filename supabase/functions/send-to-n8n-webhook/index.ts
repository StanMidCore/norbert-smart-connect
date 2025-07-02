
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'conversation' | 'logs' | 'mixed';
  timestamp: string;
  data: any;
  source: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 DÉBUT Envoi vers webhook N8N...');

  try {
    const { type, data, webhookUrl } = await req.json();
    
    if (!webhookUrl) {
      console.error('❌ URL webhook N8N manquante');
      return new Response(JSON.stringify({ 
        error: 'URL webhook N8N requise',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Valider l'URL
    try {
      new URL(webhookUrl);
    } catch (urlError) {
      console.error('❌ URL webhook invalide:', webhookUrl);
      return new Response(JSON.stringify({ 
        error: 'URL webhook invalide',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Préparer le payload pour N8N
    const payload: WebhookPayload = {
      type: type || 'mixed',
      timestamp: new Date().toISOString(),
      data: data,
      source: 'Lovable-Norbert'
    };

    console.log('📤 Envoi vers N8N:', { 
      type, 
      dataSize: JSON.stringify(data).length,
      webhookUrl: webhookUrl.substring(0, 50) + '...'
    });

    // Envoyer vers N8N avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Lovable-Norbert-Webhook/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const responseText = await response.text().catch(() => 'Pas de détails');
      console.error('❌ Erreur webhook N8N:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText,
        url: webhookUrl.substring(0, 50) + '...'
      });
      
      return new Response(JSON.stringify({ 
        error: `Erreur webhook N8N: ${response.status} - ${response.statusText}`,
        details: responseText,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseData = await response.text().catch(() => 'OK');
    console.log('✅ Données envoyées vers N8N avec succès:', {
      status: response.status,
      response: responseData.substring(0, 100)
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Données envoyées vers N8N',
      n8n_response: responseData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erreur CRITIQUE webhook N8N:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      error: `Erreur technique: ${error.message}`,
      type: error.name,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    console.log('🔄 FIN Envoi vers webhook N8N');
  }
});
