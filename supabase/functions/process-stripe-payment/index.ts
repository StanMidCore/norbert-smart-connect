
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
    const { signup_id, email } = await req.json();
    
    if (!signup_id || !email) {
      return new Response(JSON.stringify({ 
        error: 'ID inscription et email requis',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier que l'email est vérifié
    const { data: signup, error: fetchError } = await supabase
      .from('signup_process')
      .select('*')
      .eq('id', signup_id)
      .eq('email_verified', true)
      .single();

    if (fetchError || !signup) {
      console.error('Signup non trouvé ou email non vérifié:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Email non vérifié ou inscription introuvable',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('Clé Stripe secrète non configurée');
      throw new Error('Clé Stripe non configurée');
    }

    console.log('Création session Stripe Checkout pour:', email);

    // Créer une session Stripe Checkout sécurisée
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'payment_method_types[0]': 'card',
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][product_data][name]': 'Norbert - Assistant IA',
        'line_items[0][price_data][product_data][description]': 'Assistant IA automatique pour votre business',
        'line_items[0][price_data][recurring][interval]': 'month',
        'line_items[0][price_data][unit_amount]': '19700', // 197€ en centimes
        'line_items[0][quantity]': '1',
        'subscription_data[trial_period_days]': '15',
        'customer_email': email,
        'success_url': `${req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_success=true&signup_id=${signup_id}`,
        'cancel_url': `${req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_cancelled=true`,
        'metadata[signup_id]': signup_id,
        'metadata[business_name]': signup.business_name
      })
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('Erreur Stripe:', errorText);
      throw new Error(`Erreur Stripe: ${errorText}`);
    }

    const session = await stripeResponse.json();

    console.log('Session Stripe créée avec succès:', session.id);

    return new Response(JSON.stringify({ 
      success: true,
      checkout_url: session.url,
      session_id: session.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur process-stripe-payment:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
