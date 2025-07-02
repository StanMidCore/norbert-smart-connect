
import { useState, useEffect } from 'react';
import type { User } from '@/types/norbert';
import { userService } from '@/services/userService';
import { channelCleanupService } from '@/services/channelCleanupService';
import { workflowService } from '@/services/workflowService';
import { supabase } from '@/integrations/supabase/client';

export const useNorbertUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createOrGetUser = async (email: string, phoneNumber?: string) => {
    setLoading(true);
    setError(null);
    
    console.log(`👤 DÉBUT Création/récupération utilisateur: ${email}`);
    
    try {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        console.log('✅ Utilisateur existant trouvé:', existingUser.id);
        setUser(existingUser);
        return existingUser;
      }

      // Créer un nouvel utilisateur
      const newUser = await userService.createUser(email, phoneNumber);
      console.log('✅ Nouvel utilisateur créé:', newUser.id);
      
      // NETTOYER LES CANAUX IMMÉDIATEMENT
      console.log('🔄 Nettoyage IMMÉDIAT des canaux...');
      await channelCleanupService.cleanupChannelsForUser(newUser.id, newUser.email);
      
      // CRÉER LE WORKFLOW N8N IMMÉDIATEMENT
      console.log('🔄 Création IMMÉDIATE du workflow N8N...');
      await workflowService.createWorkflowForUser(newUser.email, newUser.email.split('@')[0]);
      
      setUser(newUser);
      return newUser;
    } catch (err) {
      console.error('❌ Erreur createOrGetUser:', err);
      
      // Fallback: création directe
      try {
        const newUser = await userService.createUserFallback(email, phoneNumber);
        console.log('✅ Utilisateur créé en fallback:', newUser.id);
        
        // NETTOYER ET CRÉER MÊME EN FALLBACK
        console.log('🔄 Nettoyage FALLBACK des canaux...');
        await channelCleanupService.cleanupChannelsForUser(newUser.id, newUser.email);
        
        console.log('🔄 Création FALLBACK du workflow N8N...');
        await workflowService.createWorkflowForUser(newUser.email, newUser.email.split('@')[0]);
        
        setUser(newUser);
        return newUser;
      } catch (fallbackErr) {
        console.error('❌ Erreur fallback CRITIQUE:', fallbackErr);
        setError(fallbackErr instanceof Error ? fallbackErr.message : 'Erreur inconnue');
        return null;
      }
    } finally {
      setLoading(false);
      console.log(`👤 FIN Création/récupération utilisateur: ${email}`);
    }
  };

  const getCurrentUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer l'utilisateur authentifié de Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('❌ Aucun utilisateur authentifié trouvé');
        setUser(null);
        return null;
      }

      const authenticatedUserEmail = session.user.email;
      if (!authenticatedUserEmail) {
        console.log('❌ Email utilisateur authentifié manquant');
        setUser(null);
        return null;
      }

      console.log('✅ Utilisateur authentifié trouvé:', authenticatedUserEmail);
      
      // Chercher l'utilisateur dans notre base de données
      const userByEmail = await userService.findByEmail(authenticatedUserEmail);
      
      if (userByEmail) {
        console.log('✅ Utilisateur trouvé dans la base:', userByEmail.email);
        setUser(userByEmail);
        return userByEmail;
      }

      // Si pas trouvé, créer l'utilisateur avec les données d'auth
      console.log('🔄 Création utilisateur depuis auth:', authenticatedUserEmail);
      const newUser = await createOrGetUser(authenticatedUserEmail);
      return newUser;
    } catch (err) {
      console.error('❌ Erreur getCurrentUser:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
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
