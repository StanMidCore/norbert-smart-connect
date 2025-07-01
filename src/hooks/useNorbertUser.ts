
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/norbert';

export const useNorbertUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cleanupChannelsForNewUser = async (userId: string, userEmail: string) => {
    console.log(`🧹 DÉBUT Nettoyage COMPLET pour: ${userEmail}`);
    
    try {
      // 1. SUPPRESSION LOCALE IMMÉDIATE
      console.log(`🗑️ Suppression LOCALE pour user_id: ${userId}`);
      const { error: localDeleteError } = await supabase
        .from('channels')
        .delete()
        .eq('user_id', userId);

      if (localDeleteError) {
        console.error('❌ Erreur suppression locale:', localDeleteError);
      } else {
        console.log('✅ Suppression locale réussie pour:', userEmail);
      }

      // 2. SUPPRESSION CÔTÉ SERVEUR - SYSTÉMATIQUE
      console.log(`🔧 Appel SYSTÉMATIQUE cleanup-channels pour: ${userEmail}`);
      try {
        const { data: cleanupResult, error: cleanupFunctionError } = await supabase.functions.invoke('cleanup-channels', {
          body: { user_id: userId, user_email: userEmail }
        });

        if (cleanupFunctionError) {
          console.error('❌ Erreur fonction cleanup-channels:', cleanupFunctionError);
        } else {
          console.log('✅ Fonction cleanup-channels OK:', cleanupResult);
        }
      } catch (cleanupErr) {
        console.error('❌ Erreur CRITIQUE cleanup-channels:', cleanupErr);
      }

      // 3. VÉRIFICATION FINALE
      const { data: finalChannels, error: countError } = await supabase
        .from('channels')
        .select('id')
        .eq('user_id', userId);

      if (!countError) {
        console.log(`📊 FINAL: ${finalChannels?.length || 0} canaux restants pour ${userEmail}`);
      }

    } catch (error) {
      console.error('❌ Erreur CRITIQUE nettoyage:', error);
    }
    
    console.log(`🧹 FIN Nettoyage COMPLET pour: ${userEmail}`);
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
        
        if (workflowData?.saved_to_server) {
          console.log('✅ Workflow sauvegardé sur VPS dans Personal/AGENCE IA/NORBERT/CLIENTS');
        } else {
          console.warn('⚠️ Workflow créé mais sauvegarde VPS échouée');
        }
      }
    } catch (workflowErr) {
      console.error('❌ Erreur CRITIQUE workflow N8N:', workflowErr);
    }
    
    console.log(`🚀 FIN Création workflow N8N pour: ${userEmail}`);
  };

  const createOrGetUser = async (email: string, phoneNumber?: string) => {
    setLoading(true);
    setError(null);
    
    console.log(`👤 DÉBUT Création/récupération utilisateur: ${email}`);
    
    try {
      // Vérifier si l'utilisateur existe déjà
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

      // Créer un nouvel utilisateur
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
      
      // NETTOYER LES CANAUX IMMÉDIATEMENT
      console.log('🔄 Nettoyage IMMÉDIAT des canaux...');
      await cleanupChannelsForNewUser(data.user.id, data.user.email);
      
      // CRÉER LE WORKFLOW N8N IMMÉDIATEMENT
      console.log('🔄 Création IMMÉDIATE du workflow N8N...');
      await createWorkflowForNewUser(data.user.email, data.user.email.split('@')[0]);
      
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error('❌ Erreur createOrGetUser:', err);
      
      // Fallback: création directe
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
        
        // NETTOYER ET CRÉER MÊME EN FALLBACK
        console.log('🔄 Nettoyage FALLBACK des canaux...');
        await cleanupChannelsForNewUser(newUser.id, newUser.email);
        
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
      // Vérifier les paramètres URL pour un utilisateur spécifique après paiement
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSuccess = urlParams.get('payment_success');
      
      if (paymentSuccess === 'true') {
        // Chercher le dernier utilisateur créé (le plus récent)
        console.log('🔍 Recherche du dernier utilisateur créé après paiement...');
        const { data: recentUsers, error: recentError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (recentUsers && recentUsers.length > 0 && !recentError) {
          const latestUser = recentUsers[0];
          console.log('✅ Utilisateur récent trouvé:', latestUser.email);
          setUser(latestUser);
          return latestUser;
        }
      }

      // Si pas de paiement récent, chercher l'utilisateur démo comme fallback
      console.log('🔍 Recherche utilisateur démo en fallback...');
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
