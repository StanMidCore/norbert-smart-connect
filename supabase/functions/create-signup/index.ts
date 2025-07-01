

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔄 DÉBUT Create-signup - Méthode:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Requête OPTIONS - Retour CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Récupération données requête...');
    const { email, business_name } = await req.json();
    console.log('📊 Données reçues:', { email: email ? 'présent' : 'absent', business_name: business_name ? 'présent' : 'absent' });
    
    if (!email || !business_name) {
      console.error('❌ Données manquantes:', { email: !!email, business_name: !!business_name });
      return new Response(JSON.stringify({ 
        error: 'Email et nom de l\'entreprise requis',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    console.log('🔗 Initialisation client Supabase...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Variables Supabase manquantes');
      return new Response(JSON.stringify({ 
        error: 'Configuration Supabase manquante',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Client Supabase initialisé');

    // Générer un token de vérification
    console.log('🎲 Génération token vérification...');
    const verificationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    console.log('💾 Création signup pour:', email.substring(0, 3) + '***');

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
      console.error('❌ Erreur création signup:', signupError);
      throw signupError;
    }

    console.log('✅ Signup créé avec ID:', signup.id);

    // Vérifier la clé Resend
    console.log('🔑 Vérification clé Resend...');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ Clé Resend manquante');
      return new Response(JSON.stringify({ 
        error: 'Configuration email manquante',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Envoyer l'email de vérification avec le domaine par défaut
    console.log('📧 Envoi email vérification...');
    const resend = new Resend(resendApiKey);
    
    const emailResult = await resend.emails.send({
      from: 'Norbert <onboarding@resend.dev>',
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

    console.log('📊 Résultat email:', emailResult.error ? 'ÉCHEC' : 'SUCCÈS');
    if (emailResult.error) {
      console.error('❌ Erreur envoi email:', emailResult.error);
    }

    console.log('✅ Processus signup terminé avec succès');
    return new Response(JSON.stringify({ 
      success: true,
      signup_id: signup.id,
      message: 'Compte créé ! Vérifiez votre email.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erreur CRITIQUE create-signup:', error);
    console.error('📊 Type erreur:', typeof error);
    console.error('📊 Message:', error.message);
    console.error('📊 Stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: `Erreur technique: ${error.message || 'Erreur inconnue'}`,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    console.log('🔄 FIN Create-signup');
  }
});

