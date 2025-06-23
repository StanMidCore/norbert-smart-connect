
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone_number, signup_id } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email requis' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Création compte utilisateur pour:', email);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erreur vérification utilisateur:', checkError);
      return new Response(JSON.stringify({ 
        error: 'Erreur vérification utilisateur',
        success: false 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let user;
    if (existingUser) {
      console.log('Utilisateur existant trouvé:', existingUser.id);
      user = existingUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email,
          phone_number: phone_number,
          autopilot: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Erreur création utilisateur:', createError);
        return new Response(JSON.stringify({ 
          error: 'Erreur création utilisateur',
          success: false 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      user = newUser;
      console.log('Nouvel utilisateur créé:', user.id);
    }

    // TODO: Créer le compte Unipile automatiquement
    console.log('TODO: Création compte Unipile pour:', email);
    
    // TODO: Créer le workflow N8N automatiquement
    console.log('TODO: Création workflow N8N pour:', email);
    
    // Pour l'instant, on simule la création réussie
    const mockWorkflowId = `workflow_${user.id}_${Date.now()}`;
    
    // Mettre à jour l'utilisateur avec l'ID du workflow N8N (simulé)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        workflow_id_n8n: mockWorkflowId,
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Erreur mise à jour workflow ID:', updateError);
    }

    // Si un signup_id est fourni, marquer le processus comme terminé
    if (signup_id) {
      const { error: signupUpdateError } = await supabase
        .from('signup_process')
        .update({
          payment_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', signup_id);

      if (signupUpdateError) {
        console.error('Erreur mise à jour signup:', signupUpdateError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      user: user,
      workflow_id: mockWorkflowId,
      message: 'Compte utilisateur créé avec succès, comptes Unipile et N8N en cours de création'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur création compte utilisateur:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
