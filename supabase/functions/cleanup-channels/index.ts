
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
    const { user_id, user_email } = await req.json();
    console.log(`🧹 DÉBUT NETTOYAGE SERVEUR - User: ${user_email || 'utilisateur inconnu'}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let targetUserId = user_id;
    let targetUserEmail = user_email;

    // Si pas d'ID utilisateur fourni, utiliser l'utilisateur demo comme fallback
    if (!targetUserId) {
      console.log('🔍 Recherche utilisateur demo en fallback...');
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'demo@norbert.ai')
        .single();

      if (userError || !user) {
        console.error('❌ Utilisateur demo non trouvé:', userError);
        throw new Error('Aucun utilisateur spécifié et utilisateur demo non trouvé');
      }

      targetUserId = user.id;
      targetUserEmail = user.email;
      console.log('✅ Utilisateur demo trouvé en fallback:', targetUserId);
    } else {
      console.log(`✅ Utilisateur spécifié: ${targetUserEmail} (${targetUserId})`);
    }

    // Récupérer TOUS les canaux actuels
    console.log(`📊 Récupération canaux pour user_id: ${targetUserId}`);
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', targetUserId);

    if (channelsError) {
      console.error('❌ Erreur récupération canaux:', channelsError);
      throw new Error('Erreur récupération canaux');
    }

    console.log(`📈 Canaux trouvés: ${channels?.length || 0} pour ${targetUserEmail}`);

    // SUPPRESSION MASSIVE ET IMMÉDIATE
    console.log(`🗑️ SUPPRESSION MASSIVE de TOUS les canaux pour: ${targetUserEmail}`);
    const { error: massDeleteError } = await supabase
      .from('channels')
      .delete()
      .eq('user_id', targetUserId);
      
    if (massDeleteError) {
      console.error('❌ Erreur suppression massive:', massDeleteError);
    } else {
      console.log('✅ SUPPRESSION MASSIVE réussie pour:', targetUserEmail);
    }

    // VÉRIFIER ET NETTOYER LES COMPTES UNIPILE INACTIFS
    const unipileApiKey = Deno.env.get('UNIPILE_API_KEY');
    if (unipileApiKey) {
      console.log('🔍 Vérification comptes Unipile actifs...');
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
          // CORRECTION DE L'ERREUR : vérifier que c'est bien un tableau
          const activeAccountIds = Array.isArray(unipileAccounts) ? unipileAccounts.map((acc: any) => acc.id) : [];
          console.log(`📋 Comptes Unipile actifs trouvés: ${activeAccountIds.length}`);
          
          if (activeAccountIds.length > 0 && channels && Array.isArray(channels)) {
            // Supprimer les canaux avec des account_id qui n'existent plus dans Unipile
            const channelsWithUnipileId = channels.filter(ch => ch.unipile_account_id);
            const inactiveChannels = channelsWithUnipileId.filter(ch => !activeAccountIds.includes(ch.unipile_account_id));
            
            console.log(`🗑️ Canaux inactifs trouvés: ${inactiveChannels.length}`);
            
            for (const channel of inactiveChannels) {
              const { error: deleteError } = await supabase
                .from('channels')
                .delete()
                .eq('id', channel.id);
                
              if (deleteError) {
                console.error('❌ Erreur suppression canal inactif:', channel.id, deleteError);
              } else {
                console.log('✅ Canal inactif supprimé:', channel.id);
              }
            }
          }
        } else {
          console.warn('⚠️ Erreur vérification Unipile:', response.status);
        }
      } catch (error) {
        console.error('❌ Erreur vérification Unipile:', error);
      }
    }

    // Compter les canaux finaux
    const { data: finalChannels, error: finalError } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', targetUserId);

    const finalCount = finalChannels?.length || 0;
    console.log(`📊 Canaux finaux: ${finalCount} pour ${targetUserEmail}`);
    console.log(`🧹 FIN NETTOYAGE SERVEUR - User: ${targetUserEmail}`);

    return new Response(JSON.stringify({ 
      success: true,
      user_email: targetUserEmail,
      user_id: targetUserId,
      channels_before: channels?.length || 0,
      channels_after: finalCount,
      message: `Nettoyage terminé pour ${targetUserEmail}`,
      cleanup_complete: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE nettoyage:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      cleanup_complete: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
