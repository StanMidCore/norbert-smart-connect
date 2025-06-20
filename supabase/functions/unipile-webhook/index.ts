
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = "https://dmcgxjmkvqfyvsfsiexe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtY2d4am1rdnFmeXZzZnNpZXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4OTQ5NDUsImV4cCI6MjA2NDQ3MDk0NX0.9J_QQMQjdmdKzIPyvcyVqMsP6WBZA2RneZi7pXGSbOI";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const webhookData = await req.json();
    
    console.log('Webhook Unipile reçu:', webhookData);

    // Traitement selon le type d'événement
    if (webhookData.type === 'message.received') {
      const message = webhookData.data;
      
      // Extraction des informations du message
      const messageInfo = {
        unipile_message_id: message.id,
        from_contact: message.from?.identifier || message.from?.phone || message.from?.email,
        from_name: message.from?.name || 'Client',
        content: message.body || message.text || '',
        channel_type: detectChannelType(message),
        account_id: message.account_id,
        timestamp: message.date || new Date().toISOString(),
        urgent: detectUrgency(message.body || message.text || ''),
      };

      console.log('Message traité:', messageInfo);

      // Sauvegarde en base
      const { error: saveError } = await supabase
        .from('messages')
        .insert({
          user_id: 'user1', // À adapter selon votre logique d'utilisateur
          channel_id: messageInfo.account_id,
          from_name: messageInfo.from_name,
          from_number: messageInfo.from_contact,
          body_preview: messageInfo.content.substring(0, 100),
          urgent: messageInfo.urgent,
          requires_response: true,
          handled_by: 'IA',
          timestamp: messageInfo.timestamp,
          response_status: 'pending'
        });

      if (saveError) {
        console.error('Erreur sauvegarde message:', saveError);
      }

      // Génération de la réponse IA
      const aiResponse = await generateAIResponse(messageInfo);
      
      // Envoi de la réponse via Unipile
      if (aiResponse) {
        await sendUnipileMessage(messageInfo.account_id, messageInfo.from_contact, aiResponse, messageInfo.channel_type);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Webhook traité' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erreur webhook Unipile:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function detectChannelType(message: any): string {
  if (message.channel === 'whatsapp' || message.from?.phone) return 'whatsapp';
  if (message.channel === 'email' || message.from?.email) return 'email';
  if (message.channel === 'instagram') return 'instagram';
  if (message.channel === 'facebook') return 'facebook';
  return 'unknown';
}

function detectUrgency(content: string): boolean {
  const urgentKeywords = ['urgent', 'emergency', 'fuite', 'panne', 'bloqué', 'dépannage', 'immédiat', 'rapidement'];
  return urgentKeywords.some(keyword => content.toLowerCase().includes(keyword));
}

async function generateAIResponse(messageInfo: any): Promise<string | null> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('Clé OpenAI manquante');
      return null;
    }

    const prompt = `Tu es Norbert, l'assistant IA spécialisé dans l'artisanat. 

Informations métier :
- Services : Installation sanitaire, réparation fuite, rénovation salle de bain, dépannage urgence
- Disponibilités : Lundi-Vendredi 8h-18h, Samedi 9h-17h, urgences 24h/24
- Tarifs : Déplacement 50€, taux horaire 65€, devis gratuit, supplément urgence weekend +30%

Message reçu via ${messageInfo.channel_type} de ${messageInfo.from_name} :
"${messageInfo.content}"

Urgence détectée : ${messageInfo.urgent ? 'OUI' : 'NON'}

Génère une réponse professionnelle et chaleureuse. Si urgence, propose intervention rapide. Pour devis, demande détails. Pour RDV, propose créneaux. Maximum 160 caractères pour SMS/WhatsApp.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    return aiData.choices[0]?.message?.content || null;

  } catch (error) {
    console.error('Erreur génération IA:', error);
    return null;
  }
}

async function sendUnipileMessage(accountId: string, to: string, message: string, channelType: string) {
  try {
    const unipileApiKey = 'E/f3wD65./cyZGhVVeFRacYQS7Gjl2qy+PMcVGamxIwDxJQtTuWo=';
    
    const messageData = {
      account_id: accountId,
      to: to,
      body: message,
      type: channelType === 'email' ? 'email' : 'text'
    };

    console.log('Envoi message Unipile:', messageData);

    const response = await fetch('https://api2.unipile.com:13279/api/v1/messages', {
      method: 'POST',
      headers: {
        'X-API-KEY': unipileApiKey,
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(messageData)
    });

    const result = await response.json();
    console.log('Réponse Unipile:', result);

    if (!response.ok) {
      throw new Error(`Erreur Unipile: ${result.message || 'Erreur inconnue'}`);
    }

    return result;

  } catch (error) {
    console.error('Erreur envoi message Unipile:', error);
    throw error;
  }
}
