
import { supabase } from '@/integrations/supabase/client';

export const workflowService = {
  async createWorkflowForUser(userEmail: string, userName: string): Promise<void> {
    console.log(`🚀 DÉBUT Création workflow N8N pour: ${userEmail}`);
    
    try {
      const { data: workflowData, error: workflowError } = await supabase.functions.invoke('create-n8n-workflow', {
        body: {
          userEmail: userEmail,
          userName: userName
        }
      });

      if (workflowError) {
        console.error('❌ Erreur fonction create-n8n-workflow:', workflowError);
        console.error('❌ Détails erreur workflow:', JSON.stringify(workflowError, null, 2));
      } else {
        console.log('✅ Fonction create-n8n-workflow réussie:', workflowData);
        
        if (workflowData?.saved_to_server) {
          console.log('✅ Workflow sauvegardé sur VPS dans Personal/AGENCE IA/NORBERT/CLIENTS');
        } else {
          console.warn('⚠️ Workflow créé mais sauvegarde VPS échouée');
        }
      }
    } catch (workflowErr) {
      console.error('❌ Erreur CRITIQUE workflow N8N:', workflowErr);
    }
    
    console.log(`🚀 FIN Création workflow N8N pour: ${userEmail}`);
  }
};
