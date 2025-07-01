
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 DÉBUT Export logs vers N8N...');

  try {
    const { webhookUrl, hours = 24, functions = [] } = await req.json();
    
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

    // Initialiser Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculer la date de début
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    console.log(`📊 Récupération logs depuis ${startDate.toISOString()}`);

    // Construire la requête
    let query = supabase
      .from('edge_function_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Filtrer par fonctions si spécifié
    if (functions.length > 0) {
      query = query.in('function_name', functions);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('❌ Erreur récupération logs:', error);
      throw error;
    }

    console.log(`✅ ${logs?.length || 0} logs récupérés`);

    // Organiser les logs par fonction
    const logsByFunction = logs?.reduce((acc: any, log: any) => {
      if (!acc[log.function_name]) {
        acc[log.function_name] = [];
      }
      acc[log.function_name].push(log);
      return acc;
    }, {}) || {};

    // Préparer le payload pour N8N
    const payload = {
      type: 'edge_function_logs',
      timestamp: new Date().toISOString(),
      period: {
        hours: hours,
        from: startDate.toISOString(),
        to: new Date().toISOString()
      },
      summary: {
        total_logs: logs?.length || 0,
        functions_count: Object.keys(logsByFunction).length,
        functions: Object.keys(logsByFunction)
      },
      logs_by_function: logsByFunction,
      raw_logs: logs,
      source: 'Lovable-Norbert-EdgeFunctions'
    };

    console.log('📤 Envoi logs vers N8N...');

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

    console.log('✅ Logs envoyés vers N8N avec succès');
    return new Response(JSON.stringify({ 
      success: true,
      message: `${logs?.length || 0} logs envoyés vers N8N`,
      summary: {
        total_logs: logs?.length || 0,
        functions: Object.keys(logsByFunction)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erreur CRITIQUE export logs:', error);
    return new Response(JSON.stringify({ 
      error: `Erreur technique: ${error.message}`,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    console.log('🔄 FIN Export logs vers N8N');
  }
});
