
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
      // Get channels directly from database instead of edge function
      const { data: channelsData, error: channelsError } = await supabase
        .from('channels')
        .select('*')
        .eq('status', 'connected');

      if (channelsError) {
        console.error('Erreur récupération canaux:', channelsError);
        setChannels([]);
        setAccounts([]);
        return;
      }

      console.log('Canaux trouvés:', channelsData?.length || 0);

      // Format channels
      const formattedChannels = (channelsData || []).map(channel => ({
        id: channel.id,
        unipile_account_id: channel.unipile_account_id,
        channel_type: channel.channel_type,
        status: channel.status,
        provider_info: channel.provider_info || {
          provider: channel.channel_type.toUpperCase(),
          identifier: channel.unipile_account_id,
          name: `Compte ${channel.channel_type.charAt(0).toUpperCase() + channel.channel_type.slice(1)}`
        }
      }));

      setChannels(formattedChannels);
      setAccounts([]);
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
    try {
      const { data, error } = await supabase.functions.invoke('connect-unipile-account', {
        body: { provider }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur connexion compte');
      }

      // For OAuth providers, redirect in the same window
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
