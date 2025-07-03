
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { logEvent } from '../_shared/logger.ts';

export async function createN8NWorkflow(userEmail: string, businessName: string, userId?: string) {
  console.log('🚀 === CRÉATION WORKFLOW N8N RÉEL ===');
  console.log(`📧 Email client: ${userEmail}`);
  console.log(`👤 Nom client: ${businessName}`);
  
  await logEvent({
    function_name: 'stripe-success',
    event: 'n8n_workflow_creation_started',
    user_id: userId,
    user_email: userEmail
  });
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data: workflowData, error: workflowError } = await supabase.functions.invoke('create-n8n-workflow', {
      body: {
        userEmail: userEmail,
        userName: businessName || userEmail.split('@')[0]
      },
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (workflowError) {
      console.error('❌ Erreur création workflow N8N:', workflowError);
      console.error('❌ Type d\'erreur:', typeof workflowError);
      console.error('❌ Propriétés de l\'erreur:', Object.keys(workflowError));
      console.error('❌ Message détaillé:', workflowError.message || 'Pas de message');
      console.error('❌ Context détaillé:', workflowError.context || 'Pas de context');
      
      await logEvent({
        function_name: 'stripe-success',
        event: 'n8n_workflow_creation_error',
        user_id: userId,
        user_email: userEmail,
        level: 'error',
        details: { 
          error: workflowError,
          error_type: typeof workflowError,
          error_keys: Object.keys(workflowError),
          error_message: workflowError.message,
          error_context: workflowError.context,
          error_string: String(workflowError)
        }
      });
      return null;
    } else {
      console.log('✅ Workflow N8N créé avec succès:', workflowData);
      await logEvent({
        function_name: 'stripe-success',
        event: 'n8n_workflow_created',
        user_id: userId,
        user_email: userEmail,
        details: { workflow_data: workflowData }
      });

      // Sauvegarder l'ID du workflow dans la DB
      if (userId && workflowData?.workflow_id) {
        console.log(`💾 Sauvegarde workflow_id: ${workflowData.workflow_id} pour user: ${userId}`);
        
        const { error: workflowUpdateError } = await supabase
          .from('users')
          .update({
            workflow_id_n8n: workflowData.workflow_id
          })
          .eq('id', userId);
          
        if (workflowUpdateError) {
          console.error('❌ Erreur sauvegarde workflow_id:', workflowUpdateError);
          await logEvent({
            function_name: 'stripe-success',
            event: 'workflow_id_save_error',
            user_id: userId,
            user_email: userEmail,
            level: 'error',
            details: { error: workflowUpdateError, workflow_id: workflowData.workflow_id }
          });
        } else {
          console.log('✅ Workflow ID sauvegardé dans la base de données');
          await logEvent({
            function_name: 'stripe-success',
            event: 'workflow_id_saved',
            user_id: userId,
            user_email: userEmail,
            details: { workflow_id: workflowData.workflow_id }
          });
        }
      }

      return workflowData;
    }
  } catch (workflowErr) {
    console.error('❌ Erreur CRITIQUE workflow N8N:', workflowErr);
    await logEvent({
      function_name: 'stripe-success',
      event: 'n8n_workflow_critical_error',
      user_id: userId,
      user_email: userEmail,
      level: 'error',
      details: { error: workflowErr.message }
    });
    return null;
  } finally {
    console.log('🚀 === FIN CRÉATION WORKFLOW N8N ===');
  }
}
