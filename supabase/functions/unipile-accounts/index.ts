
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

      const unipileAccounts = await response.json();
      console.log('Comptes Unipile bruts récupérés:', JSON.stringify(unipileAccounts, null, 2));
      console.log('Nombre de comptes récupérés:', unipileAccounts?.length || 0);

      // S'assurer que unipileAccounts est un tableau
      const accountsArray = Array.isArray(unipileAccounts) ? unipileAccounts : [];

      // Log détaillé de chaque compte pour débugger
      accountsArray.forEach((account, index) => {
        console.log(`Compte ${index + 1}:`, {
          id: account.id,
          provider: account.provider,
          identifier: account.identifier,
          name: account.name,
          is_active: account.is_active,
          status: account.status,
          connected: account.connected
        });
      });

      // Supprimer tous les anciens canaux locaux
      await supabase
        .from('channels')
        .delete()
        .eq('user_id', user.id);

      // Synchroniser avec notre base de données - accepter les comptes connectés même s'ils ne sont pas marqués comme "active"
      const validAccounts = [];
      
      if (accountsArray.length > 0) {
        for (const account of accountsArray) {
          // Accepter les comptes qui sont soit actifs, soit connectés, soit qui ont un statut valide
          const isValidAccount = account.is_active || 
                                 account.connected || 
                                 account.status === 'connected' ||
                                 account.status === 'active' ||
                                 // Fallback: accepter tous les comptes si on ne peut pas déterminer le statut
                                 (!account.hasOwnProperty('is_active') && !account.hasOwnProperty('connected'));
          
          if (isValidAccount) {
            console.log(`✅ Synchronisation compte valide: ${account.provider} - ${account.id}`);
            validAccounts.push(account);
            
            await supabase
              .from('channels')
              .insert({
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
          } else {
            console.log(`❌ Compte ignoré (inactif): ${account.provider} - ${account.id}`, {
              is_active: account.is_active,
              connected: account.connected,
              status: account.status
            });
          }
        }
      }

      console.log(`📊 Résumé: ${validAccounts.length}/${accountsArray.length} comptes synchronisés`);

      return new Response(JSON.stringify({ 
        success: true,
        accounts: validAccounts,
        norbert_channels: [],
        debug_info: {
          total_accounts: accountsArray.length,
          valid_accounts: validAccounts.length,
          raw_accounts: accountsArray
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
