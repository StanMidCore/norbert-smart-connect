
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

    // Get demo user
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

    // Récupération de la clé API depuis les secrets Supabase
    const unipileApiKey = Deno.env.get('UNIPILE_API_KEY');
    if (!unipileApiKey) {
      console.error('Clé API Unipile manquante dans les secrets');
      
      // Fallback: récupérer les canaux depuis notre base de données
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'connected');

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
        accounts: [],
        norbert_channels: formattedChannels,
        note: 'Utilisation des canaux locaux (clé API Unipile manquante)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Récupérer les comptes réels depuis l'API Unipile
      console.log('Récupération des comptes Unipile...');
      const response = await fetch('https://api2.unipile.com:13279/api/v1/accounts', {
        method: 'GET',
        headers: {
          'X-API-KEY': unipileApiKey,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Erreur API Unipile:', response.status, response.statusText);
        
        // Fallback: récupérer les canaux depuis notre base de données
        const { data: channels } = await supabase
          .from('channels')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'connected');

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
          accounts: [],
          norbert_channels: formattedChannels,
          note: 'Utilisation des canaux locaux (erreur API Unipile)'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const unipileAccounts = await response.json();
      console.log('Comptes Unipile récupérés:', unipileAccounts?.length || 0);

      // S'assurer que unipileAccounts est un tableau
      const accountsArray = Array.isArray(unipileAccounts) ? unipileAccounts : [];

      // Synchroniser avec notre base de données
      if (accountsArray.length > 0) {
        for (const account of accountsArray) {
          if (account.is_active) {
            await supabase
              .from('channels')
              .upsert({
                user_id: user.id,
                channel_type: account.provider.toLowerCase(),
                unipile_account_id: account.id,
                status: 'connected',
                connected_at: new Date().toISOString(),
                provider_info: {
                  provider: account.provider,
                  identifier: account.identifier || account.name || account.id,
                  name: account.name || `Compte ${account.provider}`
                }
              });
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        accounts: accountsArray,
        norbert_channels: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError) {
      console.error('Erreur lors de l\'appel à l\'API Unipile:', apiError);
      
      // Fallback: récupérer les canaux depuis notre base de données
      const { data: channels } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'connected');

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
        accounts: [],
        norbert_channels: formattedChannels,
        note: 'Utilisation des canaux locaux (erreur réseau Unipile)'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
