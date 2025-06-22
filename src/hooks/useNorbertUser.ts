
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
      // First try to get user directly from database
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (existingUser && !fetchError) {
        console.log('Utilisateur existant trouvé directement:', existingUser);
        setUser(existingUser);
        return existingUser;
      }

      // If user doesn't exist, create via edge function
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: { 
          email: email.trim(),
          phone_number: phoneNumber?.trim() 
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur création utilisateur');
      }

      console.log('Utilisateur créé:', data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('Erreur createOrGetUser:', err);
      
      // Fallback: try to create user directly in database
      try {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .upsert({
            email: email.trim(),
            phone_number: phoneNumber?.trim(),
            autopilot: true
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        console.log('Utilisateur créé en fallback:', newUser);
        setUser(newUser);
        return newUser;
      } catch (fallbackErr) {
        console.error('Erreur fallback:', fallbackErr);
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Erreur inconnue');
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get demo user first
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'demo@norbert.ai')
        .single();

      if (data && !error) {
        console.log('Utilisateur demo trouvé:', data);
        setUser(data);
        return data;
      }

      // If no demo user, that's OK
      console.log('Aucun utilisateur demo, prêt pour création');
      setUser(null);
      return null;
    } catch (err) {
      console.error('Erreur getCurrentUser:', err);
      // Don't set error for missing demo user
      setUser(null);
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
