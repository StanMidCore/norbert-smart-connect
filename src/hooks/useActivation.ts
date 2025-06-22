
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useActivation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateActivationCode = async (email: string, phoneNumber?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-activation-code', {
        body: { 
          email: email.trim(),
          phone_number: phoneNumber?.trim() 
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur génération code');
      }

      return data;
    } catch (err) {
      console.error('Erreur generateActivationCode:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const activateAccount = async (email: string, activationCode: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('activate-account', {
        body: { 
          email: email.trim(),
          activation_code: activationCode.trim()
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur activation compte');
      }

      return data;
    } catch (err) {
      console.error('Erreur activateAccount:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateActivationCode,
    activateAccount,
  };
};
