import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get demo user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@norbert.ai')
      .single();

    if (userError || !user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Get current channels
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.id);

    if (channelsError) {
      throw new Error('Erreur récupération canaux');
    }

    console.log('Canaux actuels:', channels?.length || 0);

    // Delete all duplicate WhatsApp channels, keep only the most recent one
    const whatsappChannels = channels?.filter(ch => ch.channel_type === 'whatsapp') || [];
    
    if (whatsappChannels.length > 1) {
      // Sort by created date and keep the most recent
      whatsappChannels.sort((a, b) => new Date(b.connected_at || b.created_at).getTime() - new Date(a.connected_at || a.created_at).getTime());
      
      const channelsToDelete = whatsappChannels.slice(1); // Keep first (most recent), delete others
      
      for (const channel of channelsToDelete) {
        const { error: deleteError } = await supabase
          .from('channels')
          .delete()
          .eq('id', channel.id);
          
        if (deleteError) {
          console.error('Erreur suppression canal:', channel.id, deleteError);
        } else {
          console.log('Canal supprimé:', channel.id);
        }
      }
    }

    // Get Unipile API key and verify real accounts
    const unipileApiKey = Deno.env.get('UNIPILE_API_KEY');
    if (unipileApiKey) {
      try {
        const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
          method: 'GET',
          headers: {
            'X-API-KEY': unipileApiKey,
            'accept': 'application/json'
          }
        });

        if (response.ok) {
          const unipileAccounts = await response.json();
          const activeAccountIds = (unipileAccounts || []).map((acc: any) => acc.id);
          
          // Remove channels that don't exist in Unipile anymore
          const { error: cleanupError } = await supabase
            .from('channels')
            .delete()
            .eq('user_id', user.id)
            .not('unipile_account_id', 'in', `(${activeAccountIds.map(id => `'${id}'`).join(',')})`);
            
          if (cleanupError) {
            console.error('Erreur nettoyage canaux:', cleanupError);
          } else {
            console.log('Canaux inactifs supprimés');
          }
        }
      } catch (error) {
        console.error('Erreur vérification Unipile:', error);
      }
    }

    // Get final count
    const { data: finalChannels, error: finalError } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      channels_before: channels?.length || 0,
      channels_after: finalChannels?.length || 0,
      message: 'Nettoyage terminé'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur nettoyage:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
