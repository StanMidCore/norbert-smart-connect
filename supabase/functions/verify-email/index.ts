
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
    const { signup_id, verification_code } = await req.json();
    
    if (!signup_id || !verification_code) {
      return new Response(JSON.stringify({ 
        error: 'ID inscription et code de vérification requis',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Vérification email pour:', signup_id, 'avec code:', verification_code);

    // Vérifier le code
    const { data: signup, error: fetchError } = await supabase
      .from('signup_process')
      .select('*')
      .eq('id', signup_id)
      .gt('verification_expires_at', new Date().toISOString())
      .single();

    if (fetchError || !signup) {
      console.error('Signup non trouvé ou expiré:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Code de vérification invalide ou expiré',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Vérifier le code (8 premiers caractères du token)
    const expectedCode = signup.verification_token.substring(0, 8).toUpperCase();
    if (verification_code.toUpperCase() !== expectedCode) {
      return new Response(JSON.stringify({ 
        error: 'Code de vérification incorrect',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Marquer comme vérifié
    const { error: updateError } = await supabase
      .from('signup_process')
      .update({
        email_verified: true,
        verification_token: null,
        verification_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', signup_id);

    if (updateError) {
      console.error('Erreur mise à jour:', updateError);
      throw updateError;
    }

    console.log('Email vérifié avec succès pour:', signup_id);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Email vérifié avec succès !'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur verify-email:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
