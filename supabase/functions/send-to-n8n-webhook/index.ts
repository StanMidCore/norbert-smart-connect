
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

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

    // Préparer le payload pour N8N
    const payload: WebhookPayload = {
      type: type || 'mixed',
      timestamp: new Date().toISOString(),
      data: data,
      source: 'Lovable-Norbert'
    };

    console.log('📤 Envoi vers N8N:', { type, dataSize: JSON.stringify(data).length });

    // Envoyer vers N8N
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ Erreur webhook N8N:', response.status, response.statusText);
      return new Response(JSON.stringify({ 
        error: `Erreur webhook N8N: ${response.status}`,
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Données envoyées vers N8N avec succès');
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Données envoyées vers N8N'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erreur CRITIQUE webhook N8N:', error);
    return new Response(JSON.stringify({ 
      error: `Erreur technique: ${error.message}`,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    console.log('🔄 FIN Envoi vers webhook N8N');
  }
});
