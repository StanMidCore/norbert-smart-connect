
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signup_id } = await req.json();
    
    if (!signup_id) {
      return new Response(JSON.stringify({ 
        error: 'ID inscription requis',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les infos signup
    const { data: signup, error: fetchError } = await supabase
      .from('signup_process')
      .select('*')
      .eq('id', signup_id)
      .single();

    if (fetchError || !signup) {
      console.error('Signup non trouvé:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Inscription non trouvée',
        success: false 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Générer un nouveau token
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Mettre à jour le token
    const { error: updateError } = await supabase
      .from('signup_process')
      .update({
        verification_token: verificationToken,
        verification_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', signup_id);

    if (updateError) {
      console.error('Erreur mise à jour token:', updateError);
      throw updateError;
    }

    // Renvoyer l'email avec le domaine par défaut
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    await resend.emails.send({
      from: 'Norbert <onboarding@resend.dev>',
      to: [signup.email],
      subject: 'Nouveau code de vérification - Norbert',
      html: `
        <h1>Nouveau code de vérification</h1>
        <p>Bonjour,</p>
        <p>Vous avez demandé un nouveau code de vérification pour <strong>${signup.business_name}</strong>.</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${verificationToken.substring(0, 8).toUpperCase()}
        </div>
        <p>Ce code expire dans 24 heures.</p>
        <p>À bientôt !<br>L'équipe Norbert</p>
      `
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Nouveau code envoyé !'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur resend-verification:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
