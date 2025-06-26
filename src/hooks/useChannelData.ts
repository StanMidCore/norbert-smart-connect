
import { useState, useEffect, useCallback, useRef } from 'react';
import { useUnipile } from '@/hooks/useUnipile';
import { useNorbertUser } from '@/hooks/useNorbertUser';
import { useToast } from '@/hooks/use-toast';
import type { Channel } from '@/types/norbert';
import { supabase } from '@/integrations/supabase/client';

export const useChannelData = () => {
  const { channels, loading, error, fetchAccounts } = useUnipile();
  const { user, getCurrentUser } = useNorbertUser();
  const { toast } = useToast();
  const [connectedChannels, setConnectedChannels] = useState<Channel[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasLoadedAccounts, setHasLoadedAccounts] = useState(false);
  const fetchingRef = useRef(false);

  // Initialiser l'utilisateur au chargement - une seule fois
  useEffect(() => {
    if (!user && !hasInitialized) {
      console.log('🔄 Initialisation utilisateur...');
      getCurrentUser();
      setHasInitialized(true);
    }
  }, [user, getCurrentUser, hasInitialized]);

  // Récupérer les comptes une seule fois quand l'utilisateur est disponible
  const fetchAccountsOnce = useCallback(async () => {
    if (user && !fetchingRef.current && !loading && !hasLoadedAccounts) {
      console.log('📡 Récupération des comptes pour:', user.email);
      fetchingRef.current = true;
      try {
        await fetchAccounts();
        setHasLoadedAccounts(true);
        console.log('✅ Comptes récupérés avec succès');
      } catch (err) {
        console.error('❌ Erreur récupération comptes:', err);
      } finally {
        fetchingRef.current = false;
      }
    }
  }, [user, fetchAccounts, loading, hasLoadedAccounts]);

  useEffect(() => {
    fetchAccountsOnce();
  }, [fetchAccountsOnce]);

  // Normaliser les canaux connectés
  useEffect(() => {
    if (channels.length > 0) {
      console.log('📊 Mise à jour des canaux connectés, nombre:', channels.length);
      const normalizedChannels: Channel[] = channels
        .filter(ch => ch.status === 'connected')
        .map((ch, index) => ({
          id: ch.id,
          user_id: user?.id || 'user1',
          channel_type: ch.channel_type as any,
          unipile_account_id: ch.unipile_account_id,
          status: 'connected' as const,
          priority_order: index + 1,
          connected_at: new Date().toISOString()
        }));
      
      setConnectedChannels(normalizedChannels);
    }
  }, [channels, user?.id]);

  const handleCleanupChannels = useCallback(async () => {
    try {
      console.log('🧹 Nettoyage des canaux...');
      const { data, error } = await supabase.functions.invoke('cleanup-channels');
      
      if (error) throw error;
      
      console.log('✅ Nettoyage terminé:', data);
      toast({
        title: "Nettoyage terminé",
        description: `${data.channels_before} → ${data.channels_after} canaux`,
      });
      
      // Forcer le rechargement une seule fois
      setHasLoadedAccounts(false);
      fetchingRef.current = false;
      
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
      toast({
        title: "Erreur nettoyage",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRefreshAccounts = useCallback(async () => {
    if (fetchingRef.current) return;
    console.log('🔄 Actualisation manuelle des comptes...');
    
    // Réinitialiser l'état de chargement
    setHasLoadedAccounts(false);
    fetchingRef.current = false;
    
  }, []);

  const forceRefresh = useCallback(() => {
    console.log('🔄 Actualisation forcée des comptes...');
    
    // Réinitialiser complètement l'état
    setHasLoadedAccounts(false);
    fetchingRef.current = false;
    
  }, []);

  return {
    user,
    channels,
    connectedChannels,
    loading,
    error,
    hasInitialized,
    fetchingRef,
    fetchAccountsOnce,
    handleRefreshAccounts,
    handleCleanupChannels,
    forceRefresh
  };
};
