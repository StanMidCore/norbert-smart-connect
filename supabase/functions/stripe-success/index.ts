import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2E5NWQ2NS1kZTI5LTRlN2EtYjQxZC0yYjhjZTdiYTQwYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxMDExNzgxfQ.k4c-dAmKJpK5aUk2idyW1HFNmayS3xba4PrbUGa88CY';
const N8N_BASE_URL = 'https://n8n.srv784558.hstgr.cloud';
const NORBERT_FOLDER_ID = 'uO7pivHjhurjrT2k';

const createN8NWorkflow = async (userEmail: string, userName: string) => {
  console.log(`🚀 Création du workflow N8N pour: ${userEmail}`);
  
  const workflowData = {
    name: `Norbert Workflow - ${userName}`,
    folderId: NORBERT_FOLDER_ID,
    nodes: [
      {
        parameters: {
          httpMethod: "POST",
          path: "norbert-webhook",
          responseMode: "responseNode",
          options: {}
        },
        id: "webhook-node",
        name: "Webhook",
        type: "n8n-nodes-base.webhook",
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: {
          conditions: {
            options: {
              caseSensitive: true,
              leftValue: "",
              typeValidation: "strict"
            },
            conditions: [
              {
                leftValue: "={{ $json.type }}",
                rightValue: "email_received",
                operator: {
                  type: "string",
                  operation: "equals"
                }
              }
            ],
            combinator: "and"
          }
        },
        id: "if-email-node",
        name: "If Email",
        type: "n8n-nodes-base.if",
        typeVersion: 2,
        position: [460, 300]
      },
      {
        parameters: {
          url: "https://api.openai.com/v1/chat/completions",
          authentication: "headerAuth",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "Content-Type",
                value: "application/json"
              }
            ]
          },
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: "model",
                value: "gpt-4"
              },
              {
                name: "messages",
                value: "={{ [{'role': 'system', 'content': 'Tu es Norbert, l\\'assistant IA de ' + $json.user_name + '. Réponds de manière professionnelle et personnalisée.'}, {'role': 'user', 'content': $json.message_content}] }}"
              },
              {
                name: "max_tokens",
                value: 500
              }
            ]
          }
        },
        id: "openai-node",
        name: "Generate AI Response",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4,
        position: [680, 300]
      },
      {
        parameters: {
          url: "https://api2.unipile.com:13279/api/v1/messages",
          authentication: "headerAuth",
          sendHeaders: true,
          headerParameters: {
            parameters: [
              {
                name: "X-API-KEY",
                value: "={{$json.unipile_api_key}}"
              },
              {
                name: "Content-Type",
                value: "application/json"
              }
            ]
          },
          sendBody: true,
          bodyParameters: {
            parameters: [
              {
                name: "account_id",
                value: "={{$json.account_id}}"
              },
              {
                name: "to",
                value: "={{$json.sender_email}}"
              },
              {
                name: "subject",
                value: "Re: {{$json.subject}}"
              },
              {
                name: "body",
                value: "={{$('Generate AI Response').item.json.choices[0].message.content}}"
              }
            ]
          }
        },
        id: "send-response-node",
        name: "Send Email Response",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4,
        position: [900, 300]
      },
      {
        parameters: {
          respondWith: "allIncomingItems",
          options: {}
        },
        id: "respond-webhook-node",
        name: "Respond to Webhook",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [1120, 300]
      }
    ],
    connections: {
      "Webhook": {
        "main": [
          [
            {
              "node": "If Email",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "If Email": {
        "main": [
          [
            {
              "node": "Generate AI Response",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Generate AI Response": {
        "main": [
          [
            {
              "node": "Send Email Response",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Send Email Response": {
        "main": [
          [
            {
              "node": "Respond to Webhook",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    pinData: {},
    settings: {
      executionOrder: "v1"
    },
    staticData: null,
    tags: [
      {
        name: "norbert",
        id: "norbert-tag"
      }
    ],
    triggerCount: 1,
    active: false,
    versionId: null
  };

  try {
    // Créer le workflow dans le dossier Norbert
    console.log('📝 Création du workflow N8N dans le dossier Norbert...');
    const createResponse = await fetch(`${N8N_BASE_URL}/rest/workflows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Erreur création workflow:', errorText);
      throw new Error(`Erreur création workflow: ${createResponse.statusText}`);
    }

    const workflow = await createResponse.json();
    console.log('✅ Workflow créé avec ID:', workflow.id, 'dans le dossier:', NORBERT_FOLDER_ID);

    // Activer le workflow
    console.log('🔄 Activation du workflow...');
    const activateResponse = await fetch(`${N8N_BASE_URL}/rest/workflows/${workflow.id}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      console.error('❌ Erreur activation workflow:', errorText);
      throw new Error(`Erreur activation workflow: ${activateResponse.statusText}`);
    }

    console.log('✅ Workflow activé avec succès dans le dossier Norbert');

    return {
      workflow_id: workflow.id,
      webhook_url: `${N8N_BASE_URL}/webhook/norbert-webhook`,
      folder_id: NORBERT_FOLDER_ID
    };
  } catch (error) {
    console.error('❌ Erreur complète lors de la création du workflow:', error);
    throw error;
  }
};

const cleanupChannelsForUser = async (supabase: any, userId: string, userEmail: string) => {
  console.log(`🧹 Nettoyage des canaux pour l'utilisateur: ${userEmail}`);
  
  try {
    // Supprimer tous les canaux existants pour cet utilisateur
    const { error: deleteError } = await supabase
      .from('channels')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('❌ Erreur suppression canaux:', deleteError);
    } else {
      console.log('✅ Canaux nettoyés avec succès');
    }
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des canaux:', error);
  }
};

serve(async (req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  const signupId = url.searchParams.get('signup_id');

  console.log('🔄 Traitement du paiement Stripe réussi:', { sessionId, signupId });

  if (!sessionId || !signupId) {
    console.error('❌ Paramètres manquants');
    return new Response('Paramètres manquants', { status: 400 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les détails de la session Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeResponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    if (!stripeResponse.ok) {
      throw new Error('Erreur lors de la récupération de la session Stripe');
    }

    const session = await stripeResponse.json();
    console.log('💳 Session Stripe récupérée:', session.payment_status);

    if (session.payment_status === 'paid' || session.mode === 'subscription') {
      // Marquer le paiement comme complété
      const { data: updatedSignup, error: updateError } = await supabase
        .from('signup_process')
        .update({
          payment_completed: true,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString()
        })
        .eq('id', signupId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur mise à jour signup:', updateError);
        throw updateError;
      }

      console.log('✅ Signup mis à jour avec succès');

      // Créer le compte utilisateur final
      const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
          email: updatedSignup.email,
          autopilot: true
        })
        .select()
        .single();

      if (userError && userError.code !== '23505') { // Ignorer erreur duplicate
        console.error('❌ Erreur création utilisateur:', userError);
      } else {
        console.log('✅ Utilisateur créé/mis à jour:', user?.id || 'existant');
      }

      // Nettoyer les canaux pour ce nouvel utilisateur
      if (user?.id) {
        await cleanupChannelsForUser(supabase, user.id, updatedSignup.email);
      }

      // Créer le workflow N8N dans le dossier Norbert
      try {
        console.log('🚀 Début de la création du workflow N8N dans le dossier Norbert...');
        const workflowResult = await createN8NWorkflow(updatedSignup.email, updatedSignup.email.split('@')[0]);
        console.log('✅ Workflow N8N créé et activé dans le dossier Norbert:', workflowResult);
      } catch (workflowErr) {
        console.error('❌ Erreur workflow N8N:', workflowErr);
        // Ne pas bloquer la redirection même si le workflow échoue
      }

      // Rediriger vers l'application avec un token ou session
      const redirectUrl = `${req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_success=true&email=${encodeURIComponent(updatedSignup.email)}`;
      
      console.log('🔄 Redirection vers:', redirectUrl);
      
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl,
          ...corsHeaders
        },
      });
    }

    throw new Error('Paiement non confirmé');

  } catch (error) {
    console.error('❌ Erreur stripe-success:', error);
    
    // Rediriger vers une page d'erreur
    const errorUrl = `${req.headers.get('origin') || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_error=true`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': errorUrl,
        ...corsHeaders
      },
    });
  }
});
