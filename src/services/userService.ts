
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/norbert';

export const userService = {
  async findByEmail(email: string): Promise<User | null> {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim())
      .single();

    if (existingUser && !fetchError) {
      return existingUser;
    }
    return null;
  },

  async createUser(email: string, phoneNumber?: string): Promise<User> {
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

    return data.user;
  },

  async createUserFallback(email: string, phoneNumber?: string): Promise<User> {
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
    
    return newUser;
  },

  async getMostRecentUser(): Promise<User | null> {
    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentUsers && recentUsers.length > 0 && !recentError) {
      return recentUsers[0];
    }
    return null;
  },

  async getDemoUser(): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'demo@norbert.ai')
      .single();

    if (data && !error) {
      return data;
    }
    return null;
  }
};
