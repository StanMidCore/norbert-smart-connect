
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get demo user (for now, we'll use the demo user)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@norbert.ai')
      .single();

    if (userError || !user) {
      console.error('Utilisateur démo non trouvé:', userError);
      return new Response(JSON.stringify({ 
        error: 'Utilisateur non trouvé',
        success: false 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get connected channels from our database
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'connected');

    if (channelsError) {
      console.error('Erreur récupération canaux:', channelsError);
      return new Response(JSON.stringify({ 
        error: 'Erreur récupération canaux',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Canaux connectés trouvés:', channels?.length || 0);

    // Format channels for the frontend
    const formattedChannels = (channels || []).map(channel => ({
      id: channel.unipile_account_id,
      unipile_account_id: channel.unipile_account_id,
      channel_type: channel.channel_type,
      status: channel.status,
      provider_info: channel.provider_info || {
        provider: channel.channel_type,
        identifier: `${channel.channel_type}_account`,
        name: `Compte ${channel.channel_type.charAt(0).toUpperCase() + channel.channel_type.slice(1)}`
      }
    }));

    return new Response(JSON.stringify({ 
      success: true,
      accounts: [], // Pour compatibilité
      norbert_channels: formattedChannels
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur récupération comptes:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
