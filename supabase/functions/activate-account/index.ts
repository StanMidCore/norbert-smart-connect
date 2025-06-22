
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

  try {
    const { email, activation_code } = await req.json();
    
    if (!email || !activation_code) {
      return new Response(JSON.stringify({ 
        error: 'Email et code d\'activation requis' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Activation compte pour:', email, 'avec code:', activation_code);

    // Vérifier le code d'activation
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('activation_code', activation_code)
      .gt('activation_expires_at', new Date().toISOString())
      .single();

    if (fetchError || !user) {
      console.error('Code d\'activation invalide ou expiré:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Code d\'activation invalide ou expiré',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Activer le compte
    const { data: activatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        autopilot: true,
        activation_code: null,
        activation_expires_at: null,
        activated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur activation compte:', updateError);
      throw updateError;
    }

    // Créer les canaux par défaut (simulés pour la démo)
    const defaultChannels = [
      {
        user_id: user.id,
        channel_type: 'whatsapp',
        unipile_account_id: `wa_${user.id}`,
        status: 'connected',
        provider_info: {
          provider: 'WhatsApp',
          identifier: user.phone_number || 'Demo WhatsApp',
          name: 'WhatsApp Business'
        }
      },
      {
        user_id: user.id,
        channel_type: 'email',
        unipile_account_id: `email_${user.id}`,
        status: 'connected',
        provider_info: {
          provider: 'Email',
          identifier: user.email,
          name: 'Email Professional'
        }
      }
    ];

    // Insérer les canaux
    const { error: channelsError } = await supabase
      .from('channels')
      .upsert(defaultChannels, { onConflict: 'user_id,channel_type' });

    if (channelsError) {
      console.error('Erreur création canaux:', channelsError);
      // Ne pas faire échouer l'activation pour ça
    }

    console.log('Compte activé avec succès:', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      user: activatedUser,
      message: 'Compte activé avec succès !'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur activation compte:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
