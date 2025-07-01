
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export const getDemoUser = async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Récupérer l'utilisateur demo avec l'email stan@stokn.io
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'stan@stokn.io')
    .single();
  
  if (error || !user) {
    throw new Error(`Utilisateur demo non trouvé: ${error?.message}`);
  }
  
  return { user, supabase };
};

export const storeWhatsAppChannel = async (supabase: any, userId: string, accountId: string) => {
  console.log('💾 Insertion canal WhatsApp en base...');
  
  const { error } = await supabase
    .from('channels')
    .insert({
      user_id: userId,
      unipile_account_id: accountId,
      channel_type: 'whatsapp',
      status: 'pending',
      provider_info: {
        provider: 'WhatsApp',
        account_id: accountId
      }
    });

  if (error) {
    console.error('❌ Erreur insertion canal WhatsApp:', error);
    throw error;
  }
  
  console.log('✅ Canal WhatsApp inséré avec succès');
};

export const storeEmailChannel = async (supabase: any, userId: string, accountId: string, provider: string) => {
  console.log(`💾 Insertion canal email ${provider} en base...`);
  
  const channelType = provider.toLowerCase() === 'gmail' ? 'gmail' : 'outlook';
  const providerName = provider.toLowerCase() === 'gmail' ? 'Gmail' : 'Outlook';
  
  const { error } = await supabase
    .from('channels')
    .insert({
      user_id: userId,
      unipile_account_id: accountId,
      channel_type: channelType,
      status: 'pending',
      provider_info: {
        provider: providerName,
        account_id: accountId
      }
    });

  if (error) {
    console.error(`❌ Erreur insertion canal ${provider}:`, error);
    throw error;
  }
  
  console.log(`✅ Canal ${provider} inséré avec succès`);
};
