
import { supabase } from '@/integrations/supabase/client';

export const channelCleanupService = {
  async cleanupChannelsForUser(userId: string, userEmail: string): Promise<void> {
    console.log(`🧹 DÉBUT Nettoyage COMPLET pour: ${userEmail}`);
    
    try {
      // 1. SUPPRESSION LOCALE IMMÉDIATE
      console.log(`🗑️ Suppression LOCALE pour user_id: ${userId}`);
      const { error: localDeleteError } = await supabase
        .from('channels')
        .delete()
        .eq('user_id', userId);

      if (localDeleteError) {
        console.error('❌ Erreur suppression locale:', localDeleteError);
      } else {
        console.log('✅ Suppression locale réussie pour:', userEmail);
      }

      // 2. SUPPRESSION CÔTÉ SERVEUR - SYSTÉMATIQUE
      console.log(`🔧 Appel SYSTÉMATIQUE cleanup-channels pour: ${userEmail}`);
      try {
        const { data: cleanupResult, error: cleanupFunctionError } = await supabase.functions.invoke('cleanup-channels', {
          body: { user_id: userId, user_email: userEmail }
        });

        if (cleanupFunctionError) {
          console.error('❌ Erreur fonction cleanup-channels:', cleanupFunctionError);
        } else {
          console.log('✅ Fonction cleanup-channels OK:', cleanupResult);
        }
      } catch (cleanupErr) {
        console.error('❌ Erreur CRITIQUE cleanup-channels:', cleanupErr);
      }

      // 3. VÉRIFICATION FINALE
      const { data: finalChannels, error: countError } = await supabase
        .from('channels')
        .select('id')
        .eq('user_id', userId);

      if (!countError) {
        console.log(`📊 FINAL: ${finalChannels?.length || 0} canaux restants pour ${userEmail}`);
      }

    } catch (error) {
      console.error('❌ Erreur CRITIQUE nettoyage:', error);
    }
    
    console.log(`🧹 FIN Nettoyage COMPLET pour: ${userEmail}`);
  }
};
