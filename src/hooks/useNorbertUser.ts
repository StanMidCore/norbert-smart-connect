import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/norbert';

export const useNorbertUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanupChannelsForNewUser = async (userId: string, userEmail: string) => {
    console.log(`🧹 DÉBUT Nettoyage des canaux pour: ${userEmail}`);
    
    try {
      // 1. Supprimer TOUS les canaux existants pour ce nouvel utilisateur
      console.log(`🗑️ Suppression canaux pour user_id: ${userId}`);
      const { error: cleanupError } = await supabase
        .from('channels')
        .delete()
        .eq('user_id', userId);

      if (cleanupError) {
        console.error('❌ Erreur suppression canaux locale:', cleanupError);
      } else {
        console.log('✅ Canaux supprimés localement pour:', userEmail);
      }

      // 2. Appeler la fonction de nettoyage côté serveur SYSTÉMATIQUEMENT
      console.log(`🔧 Appel fonction cleanup-channels pour: ${userEmail}`);
      try {
        const { data: cleanupResult, error: cleanupFunctionError } = await supabase.functions.invoke('cleanup-channels', {
          body: { user_id: userId, user_email: userEmail }
        });

        if (cleanupFunctionError) {
          console.error('❌ Erreur fonction cleanup-channels:', cleanupFunctionError);
        } else {
          console.log('✅ Fonction cleanup-channels terminée:', cleanupResult);
        }
      } catch (cleanupErr) {
        console.error('❌ Erreur critique fonction cleanup-channels:', cleanupErr);
      }

      // 3. Vérification finale - compter les canaux restants
      const { data: remainingChannels, error: countError } = await supabase
        .from('channels')
        .select('id')
        .eq('user_id', userId);

      if (!countError) {
        console.log(`📊 Canaux restants après nettoyage: ${remainingChannels?.length || 0} pour ${userEmail}`);
      }

    } catch (error) {
      console.error('❌ Erreur CRITIQUE lors du nettoyage:', error);
    }
    
    console.log(`🧹 FIN Nettoyage des canaux pour: ${userEmail}`);
  };

  const createWorkflowForNewUser = async (userEmail: string, userName: string) => {
    console.log(`🚀 DÉBUT Création workflow N8N pour: ${userEmail}`);
    
    try {
      const { data: workflowData, error: workflowError } = await supabase.functions.invoke('create-n8n-workflow', {
        body: {
          userEmail: userEmail,
          userName: userName
        }
      });

      if (workflowError) {
        console.error('❌ Erreur fonction create-n8n-workflow:', workflowError);
        console.error('❌ Détails erreur workflow:', JSON.stringify(workflowError, null, 2));
      } else {
        console.log('✅ Fonction create-n8n-workflow réussie:', workflowData);
        
        // Vérifier si la sauvegarde serveur a réussi
        if (workflowData?.saved_to_server) {
          console.log('✅ Workflow sauvegardé sur le serveur VPS dans Personal/AGENCE IA/NORBERT/CLIENTS');
        } else {
          console.warn('⚠️ Workflow créé mais sauvegarde serveur incertaine');
        }
      }
    } catch (workflowErr) {
      console.error('❌ Erreur CRITIQUE workflow N8N:', workflowErr);
      console.error('❌ Stack trace:', workflowErr);
    }
    
    console.log(`🚀 FIN Création workflow N8N pour: ${userEmail}`);
  };

  const createOrGetUser = async (email: string, phoneNumber?: string) => {
    setLoading(true);
    setError(null);
    
    console.log(`👤 DÉBUT Création/récupération utilisateur: ${email}`);
    
    try {
      // First try to get user directly from database
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .single();

      if (existingUser && !fetchError) {
        console.log('✅ Utilisateur existant trouvé:', existingUser.id);
        setUser(existingUser);
        return existingUser;
      }

      // If user doesn't exist, create via edge function
      console.log('🔄 Création nouveau utilisateur via edge function...');
      const { data, error } = await supabase.functions.invoke('create-user-account', {
        body: { 
          email: email.trim(),
          phone_number: phoneNumber?.trim() 
        }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur creation utilisateur');
      }

      console.log('✅ Nouvel utilisateur créé:', data.user.id);
      
      // SYSTÉMATIQUEMENT nettoyer les canaux pour TOUT nouvel utilisateur
      console.log('🔄 Nettoyage SYSTÉMATIQUE des canaux...');
      await cleanupChannelsForNewUser(data.user.id, data.user.email);
      
      // SYSTÉMATIQUEMENT créer le workflow N8N pour TOUT nouvel utilisateur
      console.log('🔄 Création SYSTÉMATIQUE du workflow N8N...');
      await createWorkflowForNewUser(data.user.email, data.user.email.split('@')[0]);
      
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('❌ Erreur createOrGetUser:', err);
      
      // Fallback: try to create user directly in database
      try {
        console.log('🔄 Tentative de création directe en fallback...');
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
        
        console.log('✅ Utilisateur créé en fallback:', newUser.id);
        
        // TOUJOURS nettoyer les canaux même en fallback
        console.log('🔄 Nettoyage FALLBACK des canaux...');
        await cleanupChannelsForNewUser(newUser.id, newUser.email);
        
        // TOUJOURS créer le workflow N8N même en fallback
        console.log('🔄 Création FALLBACK du workflow N8N...');
        await createWorkflowForNewUser(newUser.email, newUser.email.split('@')[0]);
        
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
      // Try to get demo user first
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'demo@norbert.ai')
        .single();

      if (data && !error) {
        console.log('✅ Utilisateur demo trouvé:', data.id);
        setUser(data);
        return data;
      }

      // If no demo user, that's OK
      console.log('ℹ️ Aucun utilisateur demo, prêt pour création');
      setUser(null);
      return null;
    } catch (err) {
      console.error('❌ Erreur getCurrentUser:', err);
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
