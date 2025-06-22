
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UnipileAccount {
  id: string;
  provider: string;
  identifier: string;
  name?: string;
  is_active: boolean;
}

interface UnipileChannel {
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
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('unipile-accounts');
      
      if (error) throw error;
      
      if (data.success) {
        setAccounts(data.accounts);
        setChannels(data.norbert_channels);
      } else {
        throw new Error(data.error || 'Erreur récupération comptes');
      }
    } catch (err) {
      console.error('Erreur fetchAccounts:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (provider: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('connect-unipile-account', {
        body: { provider }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur connexion compte');
      }

      // Pour les providers OAuth, rediriger vers l'URL d'autorisation dans la même fenêtre
      if (data.authorization_url) {
        console.log('Redirection vers:', data.authorization_url);
        window.location.href = data.authorization_url;
        return data;
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

  useEffect(() => {
    fetchAccounts();
  }, []);

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
