
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
    console.log('Clé API Unipile:', unipileApiKey ? 'Présente' : 'Absente');
    
    if (!unipileApiKey) {
      console.error('Clé API Unipile manquante dans les secrets');
      
      // Fallback: récupérer les canaux depuis notre base de données
      const { data: channels, error: channelsError } = await supabase
        .from('channels')
        .select('*')
        .eq('user_id', user.id);

      // Marquer tous les canaux locaux comme "déconnectés" car on ne peut pas vérifier leur statut
      if (channels && channels.length > 0) {
        await supabase
          .from('channels')
          .update({ status: 'disconnected' })
          .eq('user_id', user.id);
      }

      return new Response(JSON.stringify({ 
        success: true,
        accounts: [],
        norbert_channels: [],
        note: 'Clé API Unipile manquante - tous les canaux marqués comme déconnectés'
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
        
        // Marquer tous les canaux locaux comme déconnectés
        await supabase
          .from('channels')
          .update({ status: 'disconnected' })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ 
          success: true,
          accounts: [],
          norbert_channels: [],
          note: `Erreur API Unipile (${response.status}) - canaux marqués comme déconnectés`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const unipileResponse = await response.json();
      console.log('Réponse Unipile brute:', JSON.stringify(unipileResponse, null, 2));

      // Extraire les comptes de la structure AccountList
      let accountsArray = [];
      if (unipileResponse && unipileResponse.items && Array.isArray(unipileResponse.items)) {
        accountsArray = unipileResponse.items;
      } else if (Array.isArray(unipileResponse)) {
        // Fallback si c'est directement un tableau
        accountsArray = unipileResponse;
      }

      console.log('Nombre de comptes extraits:', accountsArray.length);

      // Log détaillé de chaque compte pour débugger
      accountsArray.forEach((account, index) => {
        console.log(`Compte ${index + 1}:`, {
          id: account.id,
          type: account.type,
          name: account.name,
          created_at: account.created_at,
          sources: account.sources
        });
      });

      // Supprimer tous les anciens canaux locaux
      console.log('Suppression des anciens canaux...');
      await supabase
        .from('channels')
        .delete()
        .eq('user_id', user.id);

      // Synchroniser avec notre base de données
      const validAccounts = [];
      
      if (accountsArray.length > 0) {
        for (const account of accountsArray) {
          // Tous les comptes retournés par Unipile sont considérés comme valides
          console.log(`✅ Synchronisation compte: ${account.type} - ${account.id}`);
          validAccounts.push(account);
          
          // Déterminer le type de canal basé sur le type Unipile
          let channelType = 'email'; // par défaut
          if (account.type === 'GOOGLE_OAUTH') {
            channelType = 'gmail';
          } else if (account.type === 'OUTLOOK') {
            channelType = 'outlook';
          } else if (account.type === 'WHATSAPP') {
            channelType = 'whatsapp';
          }
          
          await supabase
            .from('channels')
            .insert({
              user_id: user.id,
              channel_type: channelType,
              unipile_account_id: account.id,
              status: 'connected',
              connected_at: new Date().toISOString(),
              provider_info: {
                provider: account.type,
                identifier: account.name || account.id,
                name: account.name || `Compte ${account.type}`,
                created_at: account.created_at
              }
            });
        }
      }

      console.log(`📊 Résumé final: ${validAccounts.length} comptes synchronisés`);

      return new Response(JSON.stringify({ 
        success: true,
        accounts: validAccounts,
        norbert_channels: [],
        debug_info: {
          total_accounts: accountsArray.length,
          valid_accounts: validAccounts.length,
          unipile_response_type: typeof unipileResponse,
          has_items: !!unipileResponse?.items
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (apiError) {
      console.error('Erreur lors de l\'appel à l\'API Unipile:', apiError);
      
      // Marquer tous les canaux comme déconnectés en cas d'erreur réseau
      await supabase
        .from('channels')
        .update({ status: 'disconnected' })
        .eq('user_id', user.id);

      return new Response(JSON.stringify({ 
        success: true,
        accounts: [],
        norbert_channels: [],
        note: 'Erreur réseau Unipile - canaux marqués comme déconnectés'
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
