
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signup_id, email } = await req.json();
    console.log('🔄 Création session Stripe pour:', email);

    if (!signup_id || !email) {
      throw new Error('signup_id et email requis');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Récupérer l'origine de la requête pour construire les URLs de redirection
    const origin = req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co';
    
    console.log('🌐 Origin détecté:', origin);
    
    // URLs de redirection CORRECTES qui passent par notre fonction stripe-success
    const successUrl = `${origin}/api/stripe-success?session_id={CHECKOUT_SESSION_ID}&signup_id=${signup_id}`;
    const cancelUrl = `${origin}/?payment_canceled=true`;
    
    console.log('✅ Success URL:', successUrl);
    console.log('❌ Cancel URL:', cancelUrl);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Norbert - Assistant IA Personnel',
              description: 'Assistant IA qui gère vos communications automatiquement'
            },
            unit_amount: 19700, // 197€ en centimes
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        signup_id: signup_id,
        user_email: email
      }
    });

    console.log('💳 Session Stripe créée:', session.id);
    console.log('🔗 URL checkout:', session.url);

    return new Response(JSON.stringify({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Erreur process-stripe-payment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
