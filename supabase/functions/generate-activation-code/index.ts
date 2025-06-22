
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone_number } = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ 
        error: 'Email requis' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Génération code d\'activation pour:', email);

    // Générer un code d'activation unique
    const activationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Créer ou récupérer l'utilisateur
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    let user;
    if (existingUser) {
      // Mettre à jour le code d'activation
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          activation_code: activationCode,
          activation_expires_at: expiresAt.toISOString(),
          phone_number: phone_number
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    } else {
      // Créer nouvel utilisateur avec code d'activation
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: email,
          phone_number: phone_number,
          activation_code: activationCode,
          activation_expires_at: expiresAt.toISOString(),
          autopilot: false // Sera activé après validation du code
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // Envoyer le code par email
    const emailResponse = await resend.emails.send({
      from: "Norbert AI <onboarding@resend.dev>",
      to: [email],
      subject: "🚀 Votre code d'activation Norbert",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🤖 Norbert AI</h1>
            <h2 style="color: #1f2937; margin-bottom: 20px;">Votre assistant IA est prêt !</h2>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1f2937;">Votre code d'activation :</h3>
            <div style="font-size: 24px; font-weight: bold; color: #2563eb; text-align: center; padding: 15px; background: white; border-radius: 4px; letter-spacing: 2px;">
              ${activationCode}
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="color: #4b5563; line-height: 1.6;">
              Félicitations ! Votre compte Norbert AI a été préparé avec :
            </p>
            <ul style="color: #4b5563; line-height: 1.8;">
              <li>✅ Compte Unipile configuré automatiquement</li>
              <li>✅ Workflow N8N déployé et actif</li>
              <li>✅ Assistant IA prêt à gérer vos communications</li>
            </ul>
          </div>
          
          <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #1e40af; font-weight: 500;">
              🔑 Saisissez ce code dans l'application pour activer votre compte.
            </p>
            <p style="margin: 5px 0 0 0; color: #3730a3; font-size: 14px;">
              Code valide 24h - Gardez cet email précieusement !
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              Besoin d'aide ? Répondez à cet email.
            </p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Erreur envoi email:', emailResponse.error);
      throw new Error('Erreur envoi email');
    }

    console.log('Code d\'activation généré et envoyé:', activationCode);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Code d\'activation généré et envoyé par email',
      user_id: user.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur génération code activation:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
