
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🔄 Début du traitement stripe-success');
  
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const signupId = url.searchParams.get('signup_id');

  console.log('📋 Paramètres reçus:', { sessionId, signupId });

  if (!sessionId || !signupId) {
    console.log('❌ Paramètres manquants');
    return new Response('Paramètres manquants', { status: 400 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeKey) {
      console.error('❌ STRIPE_SECRET_KEY manquante');
      throw new Error('Configuration Stripe manquante');
    }
    
    console.log('🔑 Récupération session Stripe...');
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ Erreur Stripe API:', stripeResponse.status, errorText);
      throw new Error(`Erreur Stripe: ${stripeResponse.status}`);
    }

    const session = await stripeResponse.json();
    console.log('✅ Session Stripe récupérée:', {
      id: session.id,
      payment_status: session.payment_status,
      mode: session.mode
    });

    if (session.payment_status === 'paid' || session.mode === 'subscription') {
      console.log('✅ Paiement confirmé, mise à jour de la base de données');
      
      // Marquer le paiement comme complété
      const { data: updatedSignup, error: updateError } = await supabase
        .from('signup_process')
        .update({
          payment_completed: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString()
        })
        .eq('id', signupId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur mise à jour signup:', updateError);
        throw updateError;
      }

      console.log('✅ Signup mis à jour:', updatedSignup?.email);

      // Créer le compte utilisateur final
      try {
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert({
            email: updatedSignup.email,
            autopilot: true
          })
          .select()
          .single();

        if (userError && !userError.message.includes('duplicate')) {
          console.error('⚠️ Erreur création utilisateur (non-bloquante):', userError);
        } else {
          console.log('✅ Utilisateur créé/existant:', updatedSignup.email);
        }
      } catch (userCreationError) {
        console.log('⚠️ Utilisateur probablement existant, continue...');
      }

      // Construire l'URL de redirection correcte vers les canaux
      const origin = req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co';
      
      // S'assurer que l'URL contient tous les paramètres nécessaires pour la redirection
      const redirectUrl = `${origin}/?payment_success=true&redirect=channels&email=${encodeURIComponent(updatedSignup.email)}&signup_complete=true`;
      
      console.log('🔗 Redirection vers les canaux:', redirectUrl);
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
          ...corsHeaders
        },
      });
    }

    throw new Error('Paiement non confirmé');

  } catch (error) {
    console.error('❌ Erreur stripe-success:', error);
    
    // Rediriger vers une page d'erreur avec plus d'informations
    const origin = req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co';    
    const errorUrl = `${origin}/?payment_error=true&error_details=${encodeURIComponent(error.message)}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorUrl,
        ...corsHeaders
      },
    });
  }
});
