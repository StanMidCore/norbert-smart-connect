
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export async function getDemoUser() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'demo@norbert.ai')
    .single();

  if (userError || !user) {
    console.error('Utilisateur démo non trouvé:', userError);
    throw new Error('Utilisateur non trouvé');
  }

  return { user, supabase };
}

export async function storeWhatsAppChannel(supabase: any, userId: string, accountId: string) {
  const { error: insertError } = await supabase
    .from('channels')
    .upsert({
      user_id: userId,
      channel_type: 'whatsapp',
      unipile_account_id: accountId,
      status: 'connected',
      connected_at: new Date().toISOString(),
      provider_info: {
        provider: 'WHATSAPP',
        identifier: accountId,
        name: 'WhatsApp Business'
      }
    });

  if (insertError) {
    console.error('Erreur insertion canal:', insertError);
  } else {
    console.log('Canal WhatsApp créé dans la base de données');
  }
}
