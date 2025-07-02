
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export const getCurrentUser = async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Récupérer le dernier utilisateur créé (le plus récent)
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (error || !users || users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé, fallback vers demo');
    // Fallback vers demo si aucun utilisateur
    const { data: demoUser, error: demoError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@norbert.ai')
      .single();
    
    if (demoError || !demoUser) {
      throw new Error(`Aucun utilisateur trouvé: ${demoError?.message}`);
    }
    
    return { user: demoUser, supabase };
  }
  
  const user = users[0];
  console.log('✅ Utilisateur actuel trouvé:', user.email);
  
  return { user, supabase };
};

export const storeWhatsAppChannel = async (supabase: any, userId: string, accountId: string) => {
  console.log('💾 Insertion canal WhatsApp en base...');
  
  try {
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
  } catch (error) {
    console.error('❌ Erreur CRITIQUE insertion WhatsApp:', error);
    throw error;
  }
};

export const storeEmailChannel = async (supabase: any, userId: string, accountId: string, provider: string) => {
  console.log(`💾 Insertion canal email ${provider} en base...`);
  
  try {
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
  } catch (error) {
    console.error(`❌ Erreur CRITIQUE insertion canal ${provider}:`, error);
    throw error;
  }
};

export const storeInstagramChannel = async (supabase: any, userId: string, accountId: string) => {
  console.log('💾 Insertion canal Instagram en base...');
  
  try {
    const { error } = await supabase
      .from('channels')
      .insert({
        user_id: userId,
        unipile_account_id: accountId,
        channel_type: 'instagram',
        status: 'pending',
        provider_info: {
          provider: 'Instagram',
          account_id: accountId
        }
      });

    if (error) {
      console.error('❌ Erreur insertion canal Instagram:', error);
      throw error;
    }
    
    console.log('✅ Canal Instagram inséré avec succès');
  } catch (error) {
    console.error('❌ Erreur CRITIQUE insertion Instagram:', error);
    throw error;
  }
};
