
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const signupId = url.searchParams.get('signup_id');

  if (!sessionId || !signupId) {
    return new Response('Paramètres manquants', { status: 400 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les détails de la session Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    if (!stripeResponse.ok) {
      throw new Error('Erreur lors de la récupération de la session Stripe');
    }

    const session = await stripeResponse.json();
    console.log('Session Stripe récupérée:', session);

    if (session.payment_status === 'paid' || session.mode === 'subscription') {
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
        .upsert({
          email: updatedSignup.email,
          autopilot: true
        })
        .select()
        .single();

      if (userError && userError.code !== '23505') { // Ignorer erreur duplicate
        console.error('Erreur création utilisateur:', userError);
      }

      console.log('Utilisateur créé/mis à jour:', user?.id || 'existant');

      // Nettoyer les canaux pour ce nouvel utilisateur
      if (user?.id) {
        try {
          const { error: cleanupError } = await supabase
            .from('channels')
            .delete()
            .eq('user_id', user.id);

          if (cleanupError) {
            console.error('Erreur nettoyage canaux:', cleanupError);
          } else {
            console.log('Canaux nettoyés pour:', user.email);
          }
        } catch (cleanupErr) {
          console.error('Erreur lors du nettoyage:', cleanupErr);
        }
      }

      // Créer le workflow N8N
      try {
        const { data: workflowData, error: workflowError } = await supabase.functions.invoke('create-n8n-workflow', {
          body: {
            userEmail: updatedSignup.email,
            userName: updatedSignup.email.split('@')[0]
          }
        });

        if (workflowError) {
          console.error('Erreur création workflow N8N:', workflowError);
        } else {
          console.log('Workflow N8N créé avec succès:', workflowData);
        }
      } catch (workflowErr) {
        console.error('Erreur workflow N8N:', workflowErr);
      }

      // Rediriger vers l'application avec un token ou session
      const redirectUrl = `${req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_success=true&email=${encodeURIComponent(updatedSignup.email)}`;
      
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
    const errorUrl = `${req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_error=true`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorUrl,
        ...corsHeaders
      },
    });
  }
});
