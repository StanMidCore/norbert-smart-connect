
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { logEvent } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // 🧹 VRAIMENT NETTOYER LES CANAUX MAINTENANT
    let cleanupResult = null;
    if (user?.id) {
      console.log(`🧹 === NETTOYAGE RÉEL DES CANAUX ===`);
      console.log(`📧 Pour utilisateur: ${updatedSignup.email} (${user.id})`);
      
      await logEvent({
        function_name: 'stripe-success',
        event: 'cleanup_channels_started',
        user_id: user.id,
        user_email: updatedSignup.email
      });
      
      try {
        const { data: cleanupData, error: cleanupError } = await supabase.functions.invoke('cleanup-channels', {
          body: {
            user_id: user.id,
            user_email: updatedSignup.email
          }
        });

        if (cleanupError) {
          console.error('❌ Erreur cleanup-channels:', cleanupError);
          await logEvent({
            function_name: 'stripe-success',
            event: 'cleanup_channels_error',
            user_id: user.id,
            user_email: updatedSignup.email,
            level: 'error',
            details: { error: cleanupError }
          });
        } else {
          console.log('✅ Cleanup-channels réussi:', cleanupData);
          cleanupResult = cleanupData;
          await logEvent({
            function_name: 'stripe-success',
            event: 'cleanup_channels_success',
            user_id: user.id,
            user_email: updatedSignup.email,
            details: { response: cleanupData }
          });
        }
      } catch (cleanupErr) {
        console.error('❌ Erreur critique cleanup:', cleanupErr);
        await logEvent({
          function_name: 'stripe-success',
          event: 'cleanup_channels_critical_error',
          user_id: user.id,
          user_email: updatedSignup.email,
          level: 'error',
          details: { error: cleanupErr.message }
        });
      }
      
      console.log(`🧹 === FIN NETTOYAGE DES CANAUX ===`);
    }

    // 🎯 CRÉER LE WORKFLOW N8N RÉEL
    console.log('🚀 === CRÉATION WORKFLOW N8N RÉEL ===');
    console.log(`📧 Email client: ${updatedSignup.email}`);
    console.log(`👤 Nom client: ${updatedSignup.business_name}`);
    
    await logEvent({
      function_name: 'stripe-success',
      event: 'n8n_workflow_creation_started',
      user_id: user?.id,
      user_email: updatedSignup.email
    });
    
    let workflowResult = null;
    try {
      const { data: workflowData, error: workflowError } = await supabase.functions.invoke('create-n8n-workflow', {
        body: {
          userEmail: updatedSignup.email,
          userName: updatedSignup.business_name || updatedSignup.email.split('@')[0]
        }
      });

      if (workflowError) {
        console.error('❌ Erreur création workflow N8N:', workflowError);
        await logEvent({
          function_name: 'stripe-success',
          event: 'n8n_workflow_creation_error',
          user_id: user?.id,
          user_email: updatedSignup.email,
          level: 'error',
          details: { error: workflowError }
        });
      } else {
        console.log('✅ Workflow N8N créé avec succès:', workflowData);
        workflowResult = workflowData;
        await logEvent({
          function_name: 'stripe-success',
          event: 'n8n_workflow_created',
          user_id: user?.id,
          user_email: updatedSignup.email,
          details: { workflow_data: workflowData }
        });

        // Sauvegarder l'ID du workflow dans la DB
        if (user?.id && workflowData?.workflow_id) {
          console.log(`💾 Sauvegarde workflow_id: ${workflowData.workflow_id} pour user: ${user.id}`);
          
          const { error: workflowUpdateError } = await supabase
            .from('users')
            .update({
              workflow_id_n8n: workflowData.workflow_id
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
              details: { error: workflowUpdateError, workflow_id: workflowData.workflow_id }
            });
          } else {
            console.log('✅ Workflow ID sauvegardé dans la base de données');
            await logEvent({
              function_name: 'stripe-success',
              event: 'workflow_id_saved',
              user_id: user.id,
              user_email: updatedSignup.email,
              details: { workflow_id: workflowData.workflow_id }
            });
          }
        }
      }
    } catch (workflowErr) {
      console.error('❌ Erreur CRITIQUE workflow N8N:', workflowErr);
      await logEvent({
        function_name: 'stripe-success',
        event: 'n8n_workflow_critical_error',
        user_id: user?.id,
        user_email: updatedSignup.email,
        level: 'error',
        details: { error: workflowErr.message }
      });
    }
    
    console.log('🚀 === FIN CRÉATION WORKFLOW N8N ===');

    await logEvent({
      function_name: 'stripe-success',
      event: 'payment_processing_completed',
      user_id: user?.id,
      user_email: updatedSignup.email,
      details: {
        workflow_created: !!workflowResult,
        channels_cleaned: !!cleanupResult,
        success: true
      }
    });

    // Pour les appels POST (depuis le frontend), retourner une réponse JSON COMPLÈTE
    if (req.method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Paiement traité avec succès',
        user_email: updatedSignup.email,
        user_id: user?.id,
        workflow_created: !!workflowResult,
        workflow_data: workflowResult,
        channels_cleaned: !!cleanupResult,
        cleanup_data: cleanupResult
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
