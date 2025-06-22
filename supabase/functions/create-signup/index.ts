
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
    const { email, business_name } = await req.json();
    
    if (!email || !business_name) {
      return new Response(JSON.stringify({ 
        error: 'Email et nom de l\'entreprise requis',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Générer un token de vérification
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    console.log('Création signup pour:', email, business_name);

    // Créer l'entrée signup_process
    const { data: signup, error: signupError } = await supabase
      .from('signup_process')
      .upsert({
        email: email.toLowerCase().trim(),
        business_name: business_name.trim(),
        verification_token: verificationToken,
        verification_expires_at: expiresAt.toISOString(),
        email_verified: false,
        payment_completed: false
      }, { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (signupError) {
      console.error('Erreur création signup:', signupError);
      throw signupError;
    }

    // Envoyer l'email de vérification
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const emailResult = await resend.emails.send({
      from: 'Norbert <noreply@norbert.ai>',
      to: [email],
      subject: 'Vérifiez votre adresse email - Norbert',
      html: `
        <h1>Bienvenue chez Norbert !</h1>
        <p>Bonjour,</p>
        <p>Merci de vous être inscrit à Norbert pour <strong>${business_name}</strong>.</p>
        <p>Pour activer votre compte, veuillez utiliser ce code de vérification :</p>
        <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${verificationToken.substring(0, 8).toUpperCase()}
        </div>
        <p>Ce code expire dans 24 heures.</p>
        <p>À bientôt !<br>L'équipe Norbert</p>
      `
    });

    console.log('Email envoyé:', emailResult);

    return new Response(JSON.stringify({ 
      success: true,
      signup_id: signup.id,
      message: 'Compte créé ! Vérifiez votre email.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur create-signup:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
