
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

    // Workflow N8N EXACT fourni par l'utilisateur
    const workflowData = {
      "name": `Agent IA - Norbert - ${userName}`,
      "nodes": [
        {
          "parameters": {
            "options": {}
          },
          "id": "26ed489c-7ff8-4c13-afdd-b36e008e4e5a",
          "name": "OpenAI Chat Model",
          "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          "position": [680, 960],
          "typeVersion": 1,
          "credentials": {
            "openAiApi": {
              "id": "Roh8HAIQfxj49CFa",
              "name": "Stokn - OpenAi account"
            }
          }
        },
        {
          "parameters": {
            "promptType": "define",
            "text": "={{ $json.text}}",
            "options": {
              "systemMessage": `# Overview  
Tu es l'agent IA personnel d'un utilisateur artisan ou solopreneur. Tu réponds automatiquement à ses messages entrants (clients ou prospects) sur différents canaux (WhatsApp, email, etc.) pour l'aider à ne rater aucun client.  

## Context  
- Tu es intégré dans un workflow n8n individuel, lié au compte utilisateur ${userEmail}.
- Les données utilisateurs sont stockées dans Supabase (profils, canaux, messages, disponibilités, etc.).
- Chaque message entrant contient des métadonnées (canal, urgence, nom, etc.).
- Le mode Autopilot peut être activé ou non :  
  - Si activé, tu réponds automatiquement.  
  - Si désactivé, tu proposes une réponse pour validation.  

## Instructions  
1. Lis les métadonnées du message (nom, canal, texte, urgence).
2. Consulte le profil utilisateur (client_profiles) : bio, services, site, tarifs, disponibilités, instructions IA.
3. Si le message demande une action (rdv, devis, question), génère une réponse adaptée :
   - Utilise un ton professionnel, simple et amical.
   - Réponds au nom de l'utilisateur comme si c'était lui.
   - Si un rendez-vous est évoqué, propose un créneau selon les disponibilités.
4. Marque la réponse comme urgente si :
   - Le client mentionne une urgence ou situation critique.
   - Le client est pressé ou utilise un ton urgent.
5. Si le mode Autopilot est désactivé, ajoute #waiting_user_validation à ta réponse.
6. Si le client a déjà été contacté récemment, adapte ton message (évite les répétitions).
7. Logue toute réponse dans Supabase (messages.response_status = handled_by_IA).

## Tools  
- Supabase (profils, messages, canaux, calendriers)
- Webhooks Unipile (réception de messages)
- OpenAI, Claude ou Mistral pour traitement NLP

## Final Notes  
- Toutes les réponses doivent sembler humaines et contextualisées.
- Ne donne pas d'informations que tu ne peux pas vérifier (ex: créneau indisponible).
- Respecte les préférences de canal et les horaires définis.`
            }
          },
          "id": "90a55884-3dc3-43cb-adf4-c1db5295ba6d",
          "name": "Agent IA",
          "type": "@n8n/n8n-nodes-langchain.agent",
          "position": [920, 600],
          "typeVersion": 1.6
        },
        {
          "parameters": {
            "name": "user_documents",
            "description": "Contains all the user's documents that you can check for context to answer user questions."
          },
          "id": "120e4122-801d-414e-8d25-a06467c4b58e",
          "name": "Retrieve Documents",
          "type": "@n8n/n8n-nodes-langchain.toolVectorStore",
          "typeVersion": 1,
          "position": [1460, 820]
        },
        {
          "parameters": {
            "tableName": {
              "__rl": true,
              "value": "documents",
              "mode": "list",
              "cachedResultName": "documents"
            },
            "options": {
              "queryName": "match_documents"
            }
          },
          "id": "2da7e558-c6f9-425e-a36b-31382351923a",
          "name": "Supabase Vector Store",
          "type": "@n8n/n8n-nodes-langchain.vectorStoreSupabase",
          "typeVersion": 1,
          "position": [1340, 1000],
          "credentials": {
            "supabaseApi": {
              "id": "dgYnvj1mXEp8O7VB",
              "name": "Supabase account"
            }
          }
        },
        {
          "parameters": {
            "model": "gpt-4o",
            "options": {}
          },
          "id": "ac7ca00b-5f93-4162-bfa5-b573d39ba05d",
          "name": "OpenAI Chat Model3",
          "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          "typeVersion": 1,
          "position": [1660, 980],
          "credentials": {
            "openAiApi": {
              "id": "Roh8HAIQfxj49CFa",
              "name": "Stokn - OpenAi account"
            }
          }
        },
        {
          "parameters": {
            "model": "text-embedding-3-small",
            "options": {}
          },
          "id": "df8a81a1-1535-461b-8b4d-76f35dd69d0b",
          "name": "Embeddings OpenAI2",
          "type": "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
          "typeVersion": 1,
          "position": [1280, 1160],
          "credentials": {
            "openAiApi": {
              "id": "Roh8HAIQfxj49CFa",
              "name": "Stokn - OpenAi account"
            }
          }
        },
        {
          "parameters": {
            "path": `${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}-webhook`,
            "options": {}
          },
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 2,
          "position": [640, 600],
          "id": "4bcae4cf-c6c5-4bb1-b900-b1c637369984",
          "name": "Webhook",
          "webhookId": `${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}-webhook`
        },
        {
          "parameters": {
            "options": {}
          },
          "type": "n8n-nodes-base.respondToWebhook",
          "typeVersion": 1.1,
          "position": [1400, 600],
          "id": "b1d5d0e3-0c66-44ba-946c-a2f79f877ae1",
          "name": "Respond to Webhook"
        }
      ],
      "pinData": {},
      "connections": {
        "OpenAI Chat Model": {
          "ai_languageModel": [
            [
              {
                "node": "Agent IA",
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        },
        "Agent IA": {
          "main": [
            [
              {
                "node": "Respond to Webhook",
                "type": "main",
                "index": 0
              }
            ]
          ]
        },
        "Retrieve Documents": {
          "ai_tool": [
            [
              {
                "node": "Agent IA",
                "type": "ai_tool",
                "index": 0
              }
            ]
          ]
        },
        "Supabase Vector Store": {
          "ai_vectorStore": [
            [
              {
                "node": "Retrieve Documents",
                "type": "ai_vectorStore",
                "index": 0
              }
            ]
          ]
        },
        "OpenAI Chat Model3": {
          "ai_languageModel": [
            [
              {
                "node": "Retrieve Documents",
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        },
        "Embeddings OpenAI2": {
          "ai_embedding": [
            [
              {
                "node": "Supabase Vector Store",
                "type": "ai_embedding",
                "index": 0
              }
            ]
          ]
        },
        "Webhook": {
          "main": [
            [
              {
                "node": "Agent IA",
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "active": true,
      "settings": {
        "executionOrder": "v1"
      },
      "staticData": null,
      "tags": [
        {
          "name": "norbert",
          "id": "norbert-tag"
        }
      ],
      "triggerCount": 1,
      "updatedAt": new Date().toISOString(),
      "versionId": "1"
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
      webhook_url: `https://norbert.n8n.cloud/webhook/${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}-webhook`,
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
      'https://norbert.n8n.cloud/webhook/client-save',
      'https://norbert.n8n.cloud/webhook/norbert-save-client',
      'https://norbert.n8n.cloud/api/save-client-workflow'
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

    // RÉSULTAT FINAL
    if (saveSuccess) {
      console.log('🎉 WORKFLOW CRÉÉ, ACTIVÉ ET SAUVEGARDÉ AVEC SUCCÈS dans Personal/AGENCE IA/NORBERT/CLIENTS');
    } else {
      console.error('❌ ÉCHEC SAUVEGARDE - Workflow créé mais non sauvegardé sur le serveur VPS');
      console.error('❌ Dernière erreur:', lastError);
    }

    return new Response(JSON.stringify({
      success: true,
      workflow_id: workflow.id,
      webhook_url: `https://norbert.n8n.cloud/webhook/${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}-webhook`,
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
