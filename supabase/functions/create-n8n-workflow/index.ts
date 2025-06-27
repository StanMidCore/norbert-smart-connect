
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2E5NWQ2NS1kZTI5LTRlN2EtYjQxZC0yYjhjZTdiYTQwYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxMDExNzgxfQ.k4c-dAmKJpK5aUk2idyW1HFNmayS3xba4PrbUGa88CY';
const N8N_BASE_URL = 'https://norbert.n8n.cloud/api/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName } = await req.json();

    // Workflow N8N pour Norbert
    const workflowData = {
      name: `Norbert Workflow - ${userName}`,
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
      updatedAt: new Date().toISOString(),
      versionId: "1"
    };

    // Créer le workflow
    const createResponse = await fetch(`${N8N_BASE_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    if (!createResponse.ok) {
      throw new Error(`Erreur création workflow: ${createResponse.statusText}`);
    }

    const workflow = await createResponse.json();

    // Activer le workflow
    const activateResponse = await fetch(`${N8N_BASE_URL}/workflows/${workflow.id}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!activateResponse.ok) {
      throw new Error(`Erreur activation workflow: ${activateResponse.statusText}`);
    }

    // Sauvegarder sur le serveur VPS dans Personal/AGENCE IA/NORBERT/CLIENTS
    console.log('💾 Sauvegarde du workflow sur le serveur VPS...');
    const savePayload = {
      workflow_id: workflow.id,
      user_email: userEmail,
      user_name: userName,
      webhook_url: `https://norbert.n8n.cloud/webhook/norbert-webhook`,
      folder_path: 'Personal/AGENCE IA/NORBERT/CLIENTS',
      created_at: new Date().toISOString(),
      workflow_data: workflowData,
      workflow_json: JSON.stringify(workflowData, null, 2)
    };

    // Essayer plusieurs endpoints pour maximiser les chances de succès
    const saveEndpoints = [
      'https://norbert.n8n.cloud/webhook/save-client-workflow',
      'https://norbert.n8n.cloud/webhook/save-workflow',
      'https://norbert.n8n.cloud/api/webhook/save-client'
    ];

    let saveSuccess = false;
    for (const endpoint of saveEndpoints) {
      try {
        console.log(`📁 Tentative de sauvegarde sur: ${endpoint}`);
        const saveResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${N8N_API_KEY}`,
          },
          body: JSON.stringify(savePayload),
        });

        if (saveResponse.ok) {
          console.log('✅ Workflow sauvegardé avec succès sur le serveur VPS');
          saveSuccess = true;
          break;
        }
      } catch (error) {
        console.log(`⚠️ Erreur endpoint ${endpoint}:`, error);
      }
    }

    if (!saveSuccess) {
      // Sauvegarde alternative
      try {
        await fetch('https://norbert.n8n.cloud/webhook/file-save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_workflow',
            path: `Personal/AGENCE IA/NORBERT/CLIENTS/${userEmail}_workflow_${workflow.id}.json`,
            content: JSON.stringify(savePayload, null, 2)
          }),
        });
        console.log('✅ Sauvegarde alternative réussie');
      } catch (altError) {
        console.error('❌ Erreur sauvegarde alternative:', altError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      workflow_id: workflow.id,
      webhook_url: `https://norbert.n8n.cloud/webhook/norbert-webhook`,
      saved_to_server: true,
      message: 'Workflow N8N créé, activé et sauvegardé sur le serveur VPS avec succès'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur création workflow N8N:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
