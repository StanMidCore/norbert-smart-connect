
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

    // Récupérer les détails de la session Stripe
    const stripeKey = Deno.env.get('pk_live_KTfEvs7v5CNVY8MjKuPNUFma');
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    if (!stripeResponse.ok) {
      throw new Error('Erreur lors de la récupération de la session Stripe');
    }

    const session = await stripeResponse.json();
    console.log('Session Stripe récupérée:', session.payment_status);

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
        console.error('Erreur mise à jour signup:', updateError);
        throw updateError;
      }

      // Créer le compte utilisateur final
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: updatedSignup.email,
          autopilot: true
        })
        .select()
        .single();

      if (userError) {
        console.error('Erreur création utilisateur:', userError);
        // Ne pas faire échouer si l'utilisateur existe déjà
      }

      console.log('Utilisateur créé:', user?.id);

      // TODO: Ici, appeler les APIs pour créer le compte Unipile et workflow N8N
      console.log('TODO: Créer compte Unipile et workflow N8N pour:', updatedSignup.email);

      // Construire l'URL de redirection avec les bons paramètres
      const origin = req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co';
      const redirectUrl = `${origin}/?payment_success=true&email=${encodeURIComponent(updatedSignup.email)}&redirect=channels`;
      
      console.log('🔗 Redirection vers:', redirectUrl);
      
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
    console.error('Erreur stripe-success:', error);
    
    // Rediriger vers une page d'erreur
    const origin = req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co';
    const errorUrl = `${origin}/?payment_error=true`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorUrl,
        ...corsHeaders
      },
    });
  }
});
