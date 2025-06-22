
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/norbert';

export const useNorbertUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createOrGetUser = async (email: string, phoneNumber?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: { 
          email: email,
          phone_number: phoneNumber 
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur création utilisateur');
      }

      console.log('Utilisateur créé/récupéré:', data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Erreur createOrGetUser:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Pour le moment, on utilise l'utilisateur démo
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'demo@norbert.ai')
        .single();

      if (error) {
        // Si l'utilisateur n'existe pas, ce n'est pas une erreur critique
        if (error.code === 'PGRST116') {
          console.log('Aucun utilisateur demo trouvé');
          setUser(null);
          return null;
        }
        throw error;
      }
      
      console.log('Utilisateur actuel trouvé:', data);
      setUser(data);
      return data;
    } catch (err) {
      console.error('Erreur getCurrentUser:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  return {
    user,
    loading,
    error,
    createOrGetUser,
    getCurrentUser,
  };
};
