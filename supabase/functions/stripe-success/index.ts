
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { logEvent } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanupChannelsForUser = async (supabase: any, userId: string, userEmail: string) => {
  console.log(`🧹 Nettoyage des canaux pour l'utilisateur: ${userEmail}`);
  
  await logEvent({
    function_name: 'stripe-success',
    event: 'cleanup_channels_started',
    user_id: userId,
    user_email: userEmail
  });
  
  try {
    // Supprimer tous les canaux existants pour cet utilisateur
    const { error: deleteError } = await supabase
      .from('channels')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Erreur suppression canaux:', deleteError);
      await logEvent({
        function_name: 'stripe-success',
        event: 'cleanup_channels_delete_error',
        user_id: userId,
        user_email: userEmail,
        level: 'error',
        details: { error: deleteError }
      });
    } else {
      console.log('✅ Canaux nettoyés avec succès pour:', userEmail);
      await logEvent({
        function_name: 'stripe-success',
        event: 'cleanup_channels_delete_success',
        user_id: userId,
        user_email: userEmail
      });
    }

    // Appeler la fonction cleanup-channels avec les bonnes informations utilisateur
    console.log(`🔧 Appel cleanup-channels pour: ${userEmail} (${userId})`);
    const { data: cleanupData, error: cleanupError } = await supabase.functions.invoke('cleanup-channels', {
      body: {
        user_id: userId,
        user_email: userEmail
      }
    });

    if (cleanupError) {
      console.error('❌ Erreur cleanup-channels:', cleanupError);
      await logEvent({
        function_name: 'stripe-success',
        event: 'cleanup_channels_invoke_error',
        user_id: userId,
        user_email: userEmail,
        level: 'error',
        details: { error: cleanupError }
      });
    } else {
      console.log('✅ Cleanup-channels réussi:', cleanupData);
      await logEvent({
        function_name: 'stripe-success',
        event: 'cleanup_channels_invoke_success',
        user_id: userId,
        user_email: userEmail,
        details: { response: cleanupData }
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des canaux:', error);
    await logEvent({
      function_name: 'stripe-success',
      event: 'cleanup_channels_error',
      user_id: userId,
      user_email: userEmail,
      level: 'error',
      details: { error: error.message }
    });
  }
};

serve(async (req) => {
  console.log('🎯 === STRIPE SUCCESS APPELÉ ===');
  console.log('📨 URL complète:', req.url);
  console.log('📨 Method:', req.method);
  
  await logEvent({
    function_name: 'stripe-success',
    event: 'function_called',
    details: { url: req.url, method: req.method }
  });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let sessionId, signupId;

    if (req.method === 'GET') {
      // Traitement des paramètres URL (redirection Stripe)
      const url = new URL(req.url);
      sessionId = url.searchParams.get('session_id');
      signupId = url.searchParams.get('signup_id');
    } else if (req.method === 'POST') {
      // Traitement du body (appel depuis le frontend)
      const body = await req.json();
      sessionId = body.session_id;
      signupId = body.signup_id;
    }

    console.log('🔄 Traitement du paiement Stripe:', { sessionId, signupId });
    
    await logEvent({
      function_name: 'stripe-success',
      event: 'payment_processing_started',
      details: { sessionId, signupId, method: req.method }
    });

    if (!sessionId || !signupId) {
      console.error('❌ Paramètres manquants');
      await logEvent({
        function_name: 'stripe-success',
        event: 'missing_parameters',
        level: 'error',
        details: { sessionId, signupId }
      });
      return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
      await logEvent({
        function_name: 'stripe-success',
        event: 'user_creation_error',
        user_email: updatedSignup.email,
        level: 'error',
        details: { error: userError }
      });
    } else {
      console.log('✅ Utilisateur créé/mis à jour:', user?.id || 'existant');
      await logEvent({
        function_name: 'stripe-success',
        event: 'user_created',
        user_id: user?.id,
        user_email: updatedSignup.email,
        details: { created_or_updated: user ? 'created' : 'updated' }
      });
    }

    // Nettoyer les canaux pour ce nouvel utilisateur AVEC SES VRAIES INFOS
    if (user?.id) {
      console.log(`🧹 NETTOYAGE POUR LE BON UTILISATEUR: ${updatedSignup.email} (${user.id})`);
      await cleanupChannelsForUser(supabase, user.id, updatedSignup.email);
    }

    // 🎯 SIMULER LA CRÉATION DU WORKFLOW N8N (sans appeler l'API réelle)
    console.log('🚀 === SIMULATION CRÉATION WORKFLOW N8N ===');
    console.log(`📧 Email client: ${updatedSignup.email}`);
    
    await logEvent({
      function_name: 'stripe-success',
      event: 'n8n_workflow_simulation_started',
      user_id: user?.id,
      user_email: updatedSignup.email
    });
    
    // Simuler la création réussie
    const mockWorkflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`✅ Workflow N8N simulé créé avec succès: ${mockWorkflowId}`);
    
    // Sauvegarder l'ID simulé dans la DB
    if (user?.id) {
      console.log(`💾 Sauvegarde workflow_id simulé: ${mockWorkflowId} pour user: ${user.id}`);
      
      const { error: workflowUpdateError } = await supabase
        .from('users')
        .update({
          workflow_id_n8n: mockWorkflowId
        })
        .eq('id', user.id);
        
      if (workflowUpdateError) {
        console.error('❌ Erreur sauvegarde workflow_id:', workflowUpdateError);
        await logEvent({
          function_name: 'stripe-success',
          event: 'workflow_id_save_error',
          user_id: user.id,
          user_email: updatedSignup.email,
          level: 'error',
          details: { error: workflowUpdateError, workflow_id: mockWorkflowId }
        });
      } else {
        console.log('✅ Workflow ID simulé sauvegardé dans la base de données');
        await logEvent({
          function_name: 'stripe-success',
          event: 'workflow_id_saved',
          user_id: user.id,
          user_email: updatedSignup.email,
          details: { workflow_id: mockWorkflowId }
        });
      }
    }
    
    console.log('🚀 === FIN SIMULATION WORKFLOW N8N ===');

    await logEvent({
      function_name: 'stripe-success',
      event: 'payment_processing_completed',
      user_id: user?.id,
      user_email: updatedSignup.email,
      details: {
        workflow_simulated: true,
        workflow_id: mockWorkflowId,
        channels_cleaned: true,
        success: true
      }
    });

    // Pour les appels POST (depuis le frontend), retourner une réponse JSON
    if (req.method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Paiement traité avec succès',
        user_email: updatedSignup.email,
        user_id: user?.id,
        workflow_simulated: true,
        workflow_id: mockWorkflowId,
        channels_cleaned: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Pour les appels GET (redirection Stripe), rediriger
    const redirectUrl = `${req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_success=true&email=${encodeURIComponent(updatedSignup.email)}`;
    
    console.log('🔄 Redirection vers:', redirectUrl);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        ...corsHeaders
      },
    });

  } catch (error) {
    console.error('❌ Erreur stripe-success:', error);
    
    await logEvent({
      function_name: 'stripe-success',
      event: 'critical_error',
      level: 'error',
      details: { error: error.message, stack: error.stack }
    });
    
    // Pour les appels POST, retourner une erreur JSON
    if (req.method === 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Pour les appels GET, rediriger vers une page d'erreur
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
