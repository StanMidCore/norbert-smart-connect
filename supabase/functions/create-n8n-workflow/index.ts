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
    console.log(`🚀 CRÉATION WORKFLOW N8N - Email: ${userEmail}, Nom: ${userName}`);

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
    console.log('📝 Création du workflow N8N...');
    const createResponse = await fetch(`${N8N_BASE_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Erreur création workflow N8N:', errorText);
      throw new Error(`Erreur création workflow: ${createResponse.statusText} - ${errorText}`);
    }

    const workflow = await createResponse.json();
    console.log('✅ Workflow N8N créé avec ID:', workflow.id);

    // Activer le workflow
    console.log('🔄 Activation du workflow N8N...');
    const activateResponse = await fetch(`${N8N_BASE_URL}/workflows/${workflow.id}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      console.error('❌ Erreur activation workflow N8N:', errorText);
      throw new Error(`Erreur activation workflow: ${activateResponse.statusText} - ${errorText}`);
    }

    console.log('✅ Workflow N8N activé avec succès');

    // SAUVEGARDE PRIORITAIRE sur le serveur VPS dans Personal/AGENCE IA/NORBERT/CLIENTS
    console.log('💾 DÉBUT Sauvegarde workflow sur serveur VPS Personal/AGENCE IA/NORBERT/CLIENTS...');
    const savePayload = {
      workflow_id: workflow.id,
      user_email: userEmail,
      user_name: userName,
      webhook_url: `https://norbert.n8n.cloud/webhook/norbert-webhook`,
      folder_path: 'Personal/AGENCE IA/NORBERT/CLIENTS',
      created_at: new Date().toISOString(),
      workflow_data: workflowData,
      workflow_json: JSON.stringify(workflowData, null, 2),
      file_name: `${userEmail}_workflow_${workflow.id}.json`
    };

    // ESSAYER TOUS LES ENDPOINTS DE SAUVEGARDE POSSIBLES
    const saveEndpoints = [
      'https://norbert.n8n.cloud/webhook/save-client-workflow',
      'https://norbert.n8n.cloud/webhook/save-workflow', 
      'https://norbert.n8n.cloud/api/webhook/save-client',
      'https://norbert.n8n.cloud/webhook/file-save',
      'https://norbert.n8n.cloud/api/v1/save-client',
      'https://norbert.n8n.cloud/webhook/client-save'
    ];

    let saveSuccess = false;
    let lastError = null;

    for (const endpoint of saveEndpoints) {
      try {
        console.log(`📁 Tentative ${saveEndpoints.indexOf(endpoint) + 1}/${saveEndpoints.length} - Endpoint: ${endpoint}`);
        
        const saveResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${N8N_API_KEY}`,
            'X-API-KEY': N8N_API_KEY
          },
          body: JSON.stringify(savePayload),
        });

        console.log(`📡 Statut réponse ${endpoint}: ${saveResponse.status}`);
        
        if (saveResponse.ok) {
          const saveResult = await saveResponse.text();
          console.log(`✅ SUCCÈS Sauvegarde sur ${endpoint}:`, saveResult);
          saveSuccess = true;
          break;
        } else {
          const errorText = await saveResponse.text();
          console.warn(`⚠️ Échec ${endpoint} (${saveResponse.status}):`, errorText);
          lastError = errorText;
        }
      } catch (endpointError) {
        console.warn(`⚠️ Erreur réseau ${endpoint}:`, endpointError.message);
        lastError = endpointError.message;
      }
    }

    // TENTATIVE ALTERNATIVE AVEC STRUCTURE SIMPLIFIÉE
    if (!saveSuccess) {
      console.log('🔄 Tentative alternative avec structure simplifiée...');
      try {
        const simplePayload = {
          action: 'save_workflow',
          path: `Personal/AGENCE IA/NORBERT/CLIENTS/${userEmail}_workflow_${workflow.id}.json`,
          content: JSON.stringify({
            workflow_id: workflow.id,
            user_email: userEmail,
            user_name: userName,
            webhook_url: `https://norbert.n8n.cloud/webhook/norbert-webhook`,
            created_at: new Date().toISOString(),
            workflow_json: JSON.stringify(workflowData, null, 2)
          }, null, 2)
        };

        const altResponse = await fetch('https://norbert.n8n.cloud/webhook/file-save', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Action': 'save_workflow'
          },
          body: JSON.stringify(simplePayload),
        });

        if (altResponse.ok) {
          console.log('✅ SUCCÈS Sauvegarde alternative réussie');
          saveSuccess = true;
        } else {
          const altError = await altResponse.text();
          console.error('❌ Échec sauvegarde alternative:', altError);
        }
      } catch (altError) {
        console.error('❌ Erreur sauvegarde alternative:', altError);
      }
    }

    // RÉSULTAT FINAL
    if (saveSuccess) {
      console.log('🎉 WORKFLOW CRÉÉ ET SAUVEGARDÉ AVEC SUCCÈS dans Personal/AGENCE IA/NORBERT/CLIENTS');
    } else {
      console.error('❌ ÉCHEC SAUVEGARDE - Workflow créé mais non sauvegardé sur le serveur VPS');
      console.error('❌ Dernière erreur:', lastError);
    }

    return new Response(JSON.stringify({
      success: true,
      workflow_id: workflow.id,
      webhook_url: `https://norbert.n8n.cloud/webhook/norbert-webhook`,
      saved_to_server: saveSuccess,
      save_location: saveSuccess ? 'Personal/AGENCE IA/NORBERT/CLIENTS' : null,
      message: saveSuccess 
        ? 'Workflow N8N créé, activé et sauvegardé sur le serveur VPS avec succès'
        : 'Workflow N8N créé et activé, mais sauvegarde serveur échouée',
      last_save_error: saveSuccess ? null : lastError
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE création workflow N8N:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
