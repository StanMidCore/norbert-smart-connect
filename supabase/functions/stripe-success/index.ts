
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const createN8NWorkflowForClient = async (userEmail: string, userName: string) => {
  console.log(`🚀 DÉBUT création workflow N8N pour: ${userEmail}`);
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📡 Appel fonction create-n8n-workflow pour: ${userEmail}`);
    
    const { data: workflowData, error: workflowError } = await supabase.functions.invoke('create-n8n-workflow', {
      body: {
        userEmail: userEmail,
        userName: userName
      }
    });

    console.log(`📊 Réponse create-n8n-workflow:`, JSON.stringify(workflowData, null, 2));
    
    if (workflowError) {
      console.error('❌ Erreur création workflow personnalisé:', JSON.stringify(workflowError, null, 2));
      throw workflowError;
    }

    console.log('✅ Workflow N8N personnalisé créé avec succès:', workflowData);
    return workflowData;
  } catch (error) {
    console.error('❌ Erreur CRITIQUE lors de la création du workflow personnalisé:', error);
    console.error('❌ Stack trace:', error.stack);
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
  console.log('🎯 === STRIPE SUCCESS APPELÉ ===');
  console.log('📨 URL complète:', req.url);
  console.log('📨 Method:', req.method);
  
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

    if (!sessionId || !signupId) {
      console.error('❌ Paramètres manquants');
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
      throw new Error('Signup non trouvé');
    }

    console.log('📊 Données signup récupérées:', signupData.email);

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
    console.log('🚀 === DÉBUT CRÉATION WORKFLOW N8N ===');
    console.log(`📧 Email client: ${updatedSignup.email}`);
    
    try {
      const userName = updatedSignup.email.split('@')[0];
      console.log(`🔄 Appel createN8NWorkflowForClient avec: ${updatedSignup.email}, ${userName}`);
      
      const workflowResult = await createN8NWorkflowForClient(updatedSignup.email, userName);
      
      console.log('✅ Workflow N8N personnalisé créé avec succès:', JSON.stringify(workflowResult, null, 2));
      
      // Sauvegarder l'ID du workflow dans la DB
      if (workflowResult?.success && workflowResult?.workflow_id && user?.id) {
        console.log(`💾 Sauvegarde workflow_id: ${workflowResult.workflow_id} pour user: ${user.id}`);
        
        const { error: workflowUpdateError } = await supabase
          .from('users')
          .update({
            workflow_id_n8n: workflowResult.workflow_id
          })
          .eq('id', user.id);
          
        if (workflowUpdateError) {
          console.error('❌ Erreur sauvegarde workflow_id:', workflowUpdateError);
        } else {
          console.log('✅ Workflow ID sauvegardé dans la base de données');
        }
      }
      
    } catch (workflowErr) {
      console.error('❌ Erreur CRITIQUE workflow N8N personnalisé:', workflowErr);
      // Ne pas bloquer la réponse même si le workflow échoue
    }
    
    console.log('🚀 === FIN CRÉATION WORKFLOW N8N ===');

    // Pour les appels POST (depuis le frontend), retourner une réponse JSON
    if (req.method === 'POST') {
      return new Response(JSON.stringify({
        success: true,
        message: 'Paiement traité avec succès',
        user_email: updatedSignup.email
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
