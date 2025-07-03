
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UnipileAccount {
  id: string;
  provider: string;
  identifier: string;
  name?: string;
  is_active: boolean;
}

export interface UnipileChannel {
  id: string;
  unipile_account_id: string;
  channel_type: string;
  status: string;
  provider_info: {
    provider: string;
    identifier: string;
    name: string;
  };
}

export const useUnipile = () => {
  const [accounts, setAccounts] = useState<UnipileAccount[]>([]);
  const [channels, setChannels] = useState<UnipileChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    if (loading) {
      console.log('⚠️ fetchAccounts déjà en cours, ignoré');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Utiliser l'edge function pour récupérer les comptes réels depuis Unipile
      const { data, error: functionError } = await supabase.functions.invoke('unipile-accounts');

      if (functionError) {
        console.error('Erreur edge function:', functionError);
        setChannels([]);
        setAccounts([]);
        return;
      }

      if (!data || !data.success) {
        console.error('Erreur dans la réponse:', data?.error);
        setError(data?.error || 'Erreur inconnue');
        setChannels([]);
        setAccounts([]);
        return;
      }

      console.log('Comptes Unipile récupérés:', data.accounts?.length || 0);
      console.log('Canaux locaux:', data.norbert_channels?.length || 0);

      // S'assurer que les données sont des tableaux
      const realAccounts = Array.isArray(data.accounts) ? data.accounts : [];
      const localChannels = Array.isArray(data.norbert_channels) ? data.norbert_channels : [];
      
      // Convertir les comptes Unipile en format channel pour l'affichage
      const formattedChannels: UnipileChannel[] = realAccounts.map((account: any) => {
        // Mapper les types Unipile vers nos types de canaux
        let channelType = 'email'; // par défaut
        let providerName = account.type || 'unknown';
        
        if (account.type === 'GOOGLE_OAUTH') {
          channelType = 'gmail';
          providerName = 'Gmail';
        } else if (account.type === 'OUTLOOK') {
          channelType = 'outlook';
          providerName = 'Outlook';
        } else if (account.type === 'WHATSAPP') {
          channelType = 'whatsapp';
          providerName = 'WhatsApp';
        } else if (account.type === 'INSTAGRAM') {
          channelType = 'instagram';
          providerName = 'Instagram';
        }

        return {
          id: account.id,
          unipile_account_id: account.id,
          channel_type: channelType,
          status: 'connected', // Tous les comptes récupérés sont connectés
          provider_info: {
            provider: providerName,
            identifier: account.name || account.id,
            name: account.name || `Compte ${providerName}`
          }
        };
      });

      // Si pas de comptes Unipile, utiliser les canaux locaux
      if (formattedChannels.length === 0) {
        setChannels(localChannels);
      } else {
        setChannels(formattedChannels);
      }
      
      setAccounts(realAccounts);
    } catch (err) {
      console.error('Erreur fetchAccounts:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setChannels([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (provider: string) => {
    console.log('🔄 Début connectAccount pour provider:', provider);
    
    try {
      const { data, error } = await supabase.functions.invoke('connect-unipile-account', {
        body: { provider }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur connexion compte');
      }

      return data;
    } catch (err) {
      console.error('Erreur connectAccount:', err);
      throw err;
    }
  };

  const sendMessage = async (accountId: string, to: string, message: string, channelType: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-unipile-message', {
        body: {
          account_id: accountId,
          to: to,
          message: message,
          channel_type: channelType
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur envoi message');
      }

      return data;
    } catch (err) {
      console.error('Erreur sendMessage:', err);
      throw err;
    }
  };

  return {
    accounts,
    channels,
    loading,
    error,
    fetchAccounts,
    connectAccount,
    sendMessage,
  };
};
