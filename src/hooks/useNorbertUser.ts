
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/norbert';

export const useNorbertUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanupChannelsForNewUser = async (userId: string) => {
    try {
      // Nettoyer tous les canaux existants pour ce nouvel utilisateur
      const { error: cleanupError } = await supabase
        .from('channels')
        .delete()
        .eq('user_id', userId);

      if (cleanupError) {
        console.error('Erreur nettoyage canaux:', cleanupError);
      } else {
        console.log('Canaux nettoyés pour le nouvel utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  };

  const createWorkflowForNewUser = async (userEmail: string, userName: string) => {
    try {
      const { data: workflowData, error: workflowError } = await supabase.functions.invoke('create-n8n-workflow', {
        body: {
          userEmail: userEmail,
          userName: userName
        }
      });

      if (workflowError) {
        console.error('Erreur création workflow N8N:', workflowError);
      } else {
        console.log('Workflow N8N créé:', workflowData);
      }
    } catch (workflowErr) {
      console.error('Erreur workflow N8N:', workflowErr);
    }
  };

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
      
      // Nettoyer les canaux pour ce nouvel utilisateur
      await cleanupChannelsForNewUser(data.user.id);
      
      // Créer le workflow N8N pour ce nouvel utilisateur
      await createWorkflowForNewUser(data.user.email, data.user.email.split('@')[0]);
      
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
        
        // Nettoyer les canaux pour ce nouvel utilisateur
        await cleanupChannelsForNewUser(newUser.id);
        
        // Créer le workflow N8N
        await createWorkflowForNewUser(newUser.email, newUser.email.split('@')[0]);
        
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
