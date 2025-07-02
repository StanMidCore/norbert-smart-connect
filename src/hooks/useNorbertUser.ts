
import { useState, useEffect } from 'react';
import type { User } from '@/types/norbert';
import { userService } from '@/services/userService';
import { channelCleanupService } from '@/services/channelCleanupService';
import { workflowService } from '@/services/workflowService';

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
      // Vérifier les paramètres URL pour un utilisateur spécifique après paiement
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      const userEmail = urlParams.get('user_email');
      
      // Si on a un email spécifié dans l'URL, l'utiliser
      if (userEmail) {
        console.log('🔍 Email utilisateur trouvé dans URL:', userEmail);
        const userByEmail = await userService.findByEmail(decodeURIComponent(userEmail));
        
        if (userByEmail) {
          console.log('✅ Utilisateur trouvé par email URL:', userByEmail.email);
          setUser(userByEmail);
          return userByEmail;
        }
      }
      
      if (paymentSuccess === 'true') {
        // Chercher le dernier utilisateur créé (le plus récent)
        console.log('🔍 Recherche du dernier utilisateur créé après paiement...');
        const latestUser = await userService.getMostRecentUser();
        
        if (latestUser) {
          console.log('✅ Utilisateur récent trouvé:', latestUser.email);
          setUser(latestUser);
          return latestUser;
        }
      }

      // En dernier recours, chercher l'utilisateur démo
      console.log('🔍 Recherche utilisateur démo en fallback...');
      const demoUser = await userService.getDemoUser();
      
      if (demoUser) {
        console.log('✅ Utilisateur demo trouvé:', demoUser.id);
        setUser(demoUser);
        return demoUser;
      }

      // Si aucun utilisateur trouvé
      console.log('ℹ️ Aucun utilisateur trouvé, prêt pour création');
      setUser(null);
      return null;
    } catch (err) {
      console.error('❌ Erreur getCurrentUser:', err);
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
