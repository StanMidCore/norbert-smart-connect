
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { logEvent } from '../_shared/logger.ts';
import { SignupData } from './types.ts';

export async function processPayment(sessionId: string, signupId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Récupérer les détails du signup
  const { data: signupData, error: signupError } = await supabase
    .from('signup_process')
    .select('*')
    .eq('id', signupId)
    .single();

  if (signupError || !signupData) {
    console.error('❌ Erreur récupération signup:', signupError);
    await logEvent({
      function_name: 'stripe-success',
      event: 'signup_fetch_error',
      level: 'error',
      details: { signupId, error: signupError }
    });
    throw new Error('Signup non trouvé');
  }

  console.log('📊 Données signup récupérées:', signupData.email);
  await logEvent({
    function_name: 'stripe-success',
    event: 'signup_data_retrieved',
    user_email: signupData.email,
    details: { signup_id: signupId, email: signupData.email }
  });

  // Marquer le paiement comme complété
  const { data: updatedSignup, error: updateError } = await supabase
    .from('signup_process')
    .update({
      payment_completed: true,
      stripe_customer_id: 'sim_' + sessionId,
      stripe_subscription_id: 'sub_' + sessionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', signupId)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Erreur mise à jour signup:', updateError);
    await logEvent({
      function_name: 'stripe-success',
      event: 'signup_update_error',
      user_email: signupData.email,
      level: 'error',
      details: { error: updateError }
    });
    throw updateError;
  }

  console.log('✅ Signup mis à jour avec succès');
  await logEvent({
    function_name: 'stripe-success',
    event: 'signup_updated',
    user_email: updatedSignup.email,
    details: { payment_completed: true }
  });

  return updatedSignup as SignupData;
}

export async function createUserAccount(signupData: SignupData) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('👤 Création/vérification utilisateur pour:', signupData.email);
  
  // D'abord, vérifier si l'utilisateur existe déjà
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('email', signupData.email)
    .single();

  if (existingUser && !fetchError) {
    console.log('✅ Utilisateur existant trouvé:', existingUser.id);
    await logEvent({
      function_name: 'stripe-success',
      event: 'user_found_existing',
      user_id: existingUser.id,
      user_email: signupData.email,
      details: { found_existing: true }
    });
    return existingUser;
  }

  // Créer le compte utilisateur final si il n'existe pas
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      email: signupData.email,
      autopilot: true
    })
    .select()
    .single();

  if (userError) {
    console.error('❌ Erreur création utilisateur:', userError);
    await logEvent({
      function_name: 'stripe-success',
      event: 'user_creation_error',
      user_email: signupData.email,
      level: 'error',
      details: { error: userError }
    });
    throw userError;
  }

  console.log('✅ Nouvel utilisateur créé:', user.id);
  await logEvent({
    function_name: 'stripe-success',
    event: 'user_created',
    user_id: user.id,
    user_email: signupData.email,
    details: { created_new: true }
  });

  return user;
}
