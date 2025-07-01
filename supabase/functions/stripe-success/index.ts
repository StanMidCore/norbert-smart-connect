
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { logEvent } from '../_shared/logger.ts';
import { processPayment, createUserAccount } from './payment-processor.ts';
import { cleanupChannels } from './cleanup-handler.ts';
import { createN8NWorkflow } from './workflow-handler.ts';
import { createSuccessResponse, createErrorResponse } from './response-handler.ts';
import { StripeSuccessRequest, ProcessingResult } from './types.ts';

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
    let sessionId: string | null, signupId: string | null;

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
      return createErrorResponse(
        req.method,
        req.headers.get('origin'),
        { success: false, error: 'Paramètres manquants' }
      );
    }

    // Traitement du paiement
    console.log('💳 Traitement du paiement...');
    const updatedSignup = await processPayment(sessionId, signupId);
    
    // Création du compte utilisateur
    console.log('👤 Création/vérification du compte utilisateur...');
    const user = await createUserAccount(updatedSignup);

    if (!user || !user.id) {
      console.error('❌ Utilisateur non créé ou ID manquant');
      throw new Error('Impossible de créer ou récupérer l\'utilisateur');
    }

    console.log('✅ Utilisateur confirmé avec ID:', user.id);

    // Nettoyage des canaux - AVEC ID UTILISATEUR VALIDE
    console.log('🧹 DÉBUT NETTOYAGE DES CANAUX');
    console.log(`🧹 Appel cleanup pour user: ${user.id} (${updatedSignup.email})`);
    
    const cleanupResult = await cleanupChannels(user.id, updatedSignup.email);
    const channelsCleaned = !!cleanupResult;
    console.log(`🧹 Résultat cleanup: ${channelsCleaned ? 'RÉUSSI' : 'ÉCHEC'}`);

    // Création du workflow N8N
    console.log('🚀 Création du workflow N8N...');
    const workflowResult = await createN8NWorkflow(
      updatedSignup.email,
      updatedSignup.business_name || updatedSignup.email.split('@')[0],
      user.id
    );
    const workflowCreated = !!workflowResult;

    await logEvent({
      function_name: 'stripe-success',
      event: 'payment_processing_completed',
      user_id: user.id,
      user_email: updatedSignup.email,
      details: {
        workflow_created: workflowCreated,
        channels_cleaned: channelsCleaned,
        success: true
      }
    });

    const result: ProcessingResult = {
      success: true,
      user_email: updatedSignup.email,
      user_id: user.id,
      workflow_created: workflowCreated,
      workflow_data: workflowResult,
      channels_cleaned: channelsCleaned,
      cleanup_data: cleanupResult
    };

    console.log('✅ TRAITEMENT COMPLET TERMINÉ:', {
      user_email: result.user_email,
      user_id: result.user_id,
      workflow_created: result.workflow_created,
      channels_cleaned: result.channels_cleaned
    });

    return createSuccessResponse(req.method, req.headers.get('origin'), result);

  } catch (error) {
    console.error('❌ Erreur stripe-success:', error);
    
    await logEvent({
      function_name: 'stripe-success',
      event: 'critical_error',
      level: 'error',
      details: { error: error.message, stack: error.stack }
    });
    
    return createErrorResponse(
      req.method,
      req.headers.get('origin'),
      { success: false, error: error.message }
    );
  }
});
