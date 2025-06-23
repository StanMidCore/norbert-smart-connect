
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
    const { signup_id, email, card, billing_details } = await req.json();
    
    if (!signup_id || !email || !card) {
      return new Response(JSON.stringify({ 
        error: 'Données de paiement manquantes',
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

    console.log('Traitement du paiement Stripe pour:', email);

    // Créer ou récupérer le client Stripe - CORRECTION: utiliser URLSearchParams pour GET
    let customerId;
    const searchParams = new URLSearchParams({ query: `email:'${email}'` });
    const customerResponse = await fetch(`https://api.stripe.com/v1/customers/search?${searchParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    const existingCustomers = await customerResponse.json();
    
    if (existingCustomers.data && existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Créer un nouveau client
      const newCustomerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: email,
          name: billing_details.name
        })
      });
      
      const newCustomer = await newCustomerResponse.json();
      customerId = newCustomer.id;
    }

    // Créer une méthode de paiement
    const paymentMethodResponse = await fetch('https://api.stripe.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'type': 'card',
        'card[number]': card.number,
        'card[exp_month]': card.exp_month.toString(),
        'card[exp_year]': card.exp_year.toString(),
        'card[cvc]': card.cvc,
        'billing_details[name]': billing_details.name,
        'billing_details[email]': billing_details.email
      })
    });

    if (!paymentMethodResponse.ok) {
      const errorData = await paymentMethodResponse.json();
      console.error('Erreur création méthode de paiement:', errorData);
      throw new Error(errorData.error?.message || 'Erreur lors de la création de la méthode de paiement');
    }

    const paymentMethod = await paymentMethodResponse.json();

    // Attacher la méthode de paiement au client
    await fetch(`https://api.stripe.com/v1/payment_methods/${paymentMethod.id}/attach`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId
      })
    });

    // Créer l'abonnement avec période d'essai
    const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'items[0][price_data][currency]': 'eur',
        'items[0][price_data][product_data][name]': 'Norbert - Assistant IA',
        'items[0][price_data][recurring][interval]': 'month',
        'items[0][price_data][unit_amount]': '19700',
        default_payment_method: paymentMethod.id,
        trial_period_days: '15',
        'metadata[signup_id]': signup_id,
        'metadata[business_name]': signup.business_name
      })
    });

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.json();
      console.error('Erreur création abonnement:', errorData);
      throw new Error(errorData.error?.message || 'Erreur lors de la création de l\'abonnement');
    }

    const subscription = await subscriptionResponse.json();

    console.log('Abonnement créé avec succès:', subscription.id);

    // Mettre à jour les données d'inscription
    const { error: updateError } = await supabase
      .from('signup_process')
      .update({
        payment_completed: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', signup_id);

    if (updateError) {
      console.error('Erreur mise à jour signup:', updateError);
      throw updateError;
    }

    // Créer le compte utilisateur final
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: signup.email,
        autopilot: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Erreur création utilisateur:', userError);
      // Ne pas faire échouer si l'utilisateur existe déjà
    }

    console.log('Utilisateur créé:', user?.id);

    return new Response(JSON.stringify({ 
      success: true,
      subscription_id: subscription.id,
      customer_id: customerId
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
