
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { logEvent } from '../_shared/logger.ts';

export async function cleanupChannels(userId: string, userEmail: string) {
  console.log(`🧹 === NETTOYAGE RÉEL DES CANAUX ===`);
  console.log(`📧 Pour utilisateur: ${userEmail} (${userId})`);
  
  await logEvent({
    function_name: 'stripe-success',
    event: 'cleanup_channels_started',
    user_id: userId,
    user_email: userEmail
  });
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('🔄 Appel de la fonction cleanup-channels...');
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
        event: 'cleanup_channels_error',
        user_id: userId,
        user_email: userEmail,
        level: 'error',
        details: { error: cleanupError }
      });
      return null;
    } else {
      console.log('✅ Cleanup-channels réussi:', cleanupData);
      await logEvent({
        function_name: 'stripe-success',
        event: 'cleanup_channels_success',
        user_id: userId,
        user_email: userEmail,
        details: { response: cleanupData }
      });
      return cleanupData;
    }
  } catch (cleanupErr) {
    console.error('❌ Erreur critique cleanup:', cleanupErr);
    await logEvent({
      function_name: 'stripe-success',
      event: 'cleanup_channels_critical_error',
      user_id: userId,
      user_email: userEmail,
      level: 'error',
      details: { error: cleanupErr.message }
    });
    return null;
  } finally {
    console.log(`🧹 === FIN NETTOYAGE DES CANAUX ===`);
  }
}
