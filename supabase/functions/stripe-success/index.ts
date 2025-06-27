
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createN8NWorkflowForClient = async (userEmail: string, userName: string) => {
  console.log(`🚀 Création du workflow N8N personnalisé pour: ${userEmail}`);
  
  try {
    // Appeler la fonction create-n8n-workflow avec les détails du client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: workflowData, error: workflowError } = await supabase.functions.invoke('create-n8n-workflow', {
      body: {
        userEmail: userEmail,
        userName: userName
      }
    });

    if (workflowError) {
      console.error('❌ Erreur création workflow personnalisé:', workflowError);
      throw workflowError;
    }

    console.log('✅ Workflow N8N personnalisé créé:', workflowData);
    return workflowData;
  } catch (error) {
    console.error('❌ Erreur complète lors de la création du workflow personnalisé:', error);
    throw error;
  }
};

const cleanupChannelsForUser = async (supabase: any, userId: string, userEmail: string) => {
  console.log(`🧹 Nettoyage des canaux pour l'utilisateur: ${userEmail}`);
  
  try {
    // Supprimer tous les canaux existants pour cet utilisateur
    const { error: deleteError } = await supabase
      .from('channels')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Erreur suppression canaux:', deleteError);
    } else {
      console.log('✅ Canaux nettoyés avec succès');
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des canaux:', error);
  }
};

serve(async (req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const signupId = url.searchParams.get('signup_id');

  console.log('🔄 Traitement du paiement Stripe réussi:', { sessionId, signupId });

  if (!sessionId || !signupId) {
    console.error('❌ Paramètres manquants');
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
    console.log('💳 Session Stripe récupérée:', session.payment_status);

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
        console.error('❌ Erreur mise à jour signup:', updateError);
        throw updateError;
      }

      console.log('✅ Signup mis à jour avec succès');

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
        console.error('❌ Erreur création utilisateur:', userError);
      } else {
        console.log('✅ Utilisateur créé/mis à jour:', user?.id || 'existant');
      }

      // Nettoyer les canaux pour ce nouvel utilisateur
      if (user?.id) {
        await cleanupChannelsForUser(supabase, user.id, updatedSignup.email);
      }

      // 🎯 CRÉER LE WORKFLOW N8N PERSONNALISÉ POUR CE CLIENT
      try {
        console.log('🚀 Début de la création du workflow N8N personnalisé...');
        const userName = updatedSignup.email.split('@')[0]; // Utiliser la partie avant @
        const workflowResult = await createN8NWorkflowForClient(updatedSignup.email, userName);
        
        console.log('✅ Workflow N8N personnalisé créé:', workflowResult);
        
        // Sauvegarder l'ID du workflow et l'URL du webhook dans la DB
        if (workflowResult.success && user?.id) {
          const { error: workflowUpdateError } = await supabase
            .from('users')
            .update({
              workflow_id_n8n: workflowResult.workflow_id
            })
            .eq('id', user.id);
            
          if (workflowUpdateError) {
            console.error('❌ Erreur sauvegarde workflow_id:', workflowUpdateError);
          } else {
            console.log('✅ Workflow ID sauvegardé pour l\'utilisateur');
          }
        }
        
      } catch (workflowErr) {
        console.error('❌ Erreur workflow N8N personnalisé:', workflowErr);
        // Ne pas bloquer la redirection même si le workflow échoue
      }

      // Rediriger vers l'application avec un token ou session
      const redirectUrl = `${req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_success=true&email=${encodeURIComponent(updatedSignup.email)}`;
      
      console.log('🔄 Redirection vers:', redirectUrl);
      
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
