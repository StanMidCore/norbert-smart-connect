
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2E5NWQ2NS1kZTI5LTRlN2EtYjQxZC0yYjhjZTdiYTQwYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxMDExNzgxfQ.k4c-dAmKJpK5aUk2idyW1HFNmayS3xba4PrbUGa88CY';
const N8N_BASE_URL = 'https://n8n.srv784558.hstgr.cloud';
const NORBERT_FOLDER_ID = 'uO7pivHjhurjrT2k';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName } = await req.json();
    console.log(`🚀 CRÉATION WORKFLOW N8N PERSONNALISÉ - Email: ${userEmail}, Nom: ${userName}`);

    // Générer un webhook unique basé sur l'email du client
    const webhookPath = `${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}-webhook`;
    console.log(`🔗 Webhook personnalisé: ${webhookPath}`);

    // Workflow N8N personnalisé avec le nom = email du client
    const workflowData = {
      "name": userEmail, // 🎯 NOM = EMAIL DU CLIENT
      "folderId": NORBERT_FOLDER_ID,
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
            "text": "={{ $json.text || $json.message_content || $json.content }}",
            "options": {
              "systemMessage": `# Agent IA Personnel - ${userEmail}

Tu es l'assistant IA personnel de ${userEmail}. Tu réponds automatiquement aux messages entrants (clients ou prospects) sur différents canaux pour l'aider à ne rater aucun client.

## Informations Client
- Email: ${userEmail}
- Nom: ${userName}

## Context  
- Tu es intégré dans un workflow n8n individuel pour ${userEmail}
- Les données clients sont stockées dans Supabase (profils, canaux, messages, disponibilités, etc.)
- Chaque message entrant contient des métadonnées (canal, urgence, nom, etc.)
- Le mode Autopilot peut être activé ou non

## Instructions Personnalisées
1. Tu réponds AU NOM DE ${userEmail} comme si c'était lui/elle qui écrivait
2. Utilise les informations de son profil business (activité, services, tarifs, disponibilités)
3. Adapte ton ton selon son secteur d'activité
4. Si un rendez-vous est évoqué, propose selon ses disponibilités
5. Marque urgent si le client mentionne une urgence
6. Respecte ses préférences de canal et horaires

## Données Disponibles
- Activité et services: Reçus via webhook lors de la configuration du profil
- Canaux connectés: WhatsApp, Email, etc. reçus lors de la configuration
- Disponibilités et tarifs: Configurés par ${userEmail}

## Response Style
- Professionnel mais amical
- Personnalisé selon l'activité de ${userEmail}
- Évite les répétitions si contact récent
- Toujours utile et orienté action`
            }
          },
          "id": "90a55884-3dc3-43cb-adf4-c1db5295ba6d",
          "name": `Agent IA - ${userEmail}`,
          "type": "@n8n/n8n-nodes-langchain.agent",
          "position": [920, 600],
          "typeVersion": 1.6
        },
        {
          "parameters": {
            "name": "client_documents",
            "description": `Documents et informations business de ${userEmail} pour contextualiser les réponses`
          },
          "id": "120e4122-801d-414e-8d25-a06467c4b58e",
          "name": "Retrieve Client Documents",
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
            "path": webhookPath, // 🎯 WEBHOOK UNIQUE PAR CLIENT
            "options": {}
          },
          "type": "n8n-nodes-base.webhook",
          "typeVersion": 2,
          "position": [640, 600],
          "id": "4bcae4cf-c6c5-4bb1-b900-b1c637369984",
          "name": "Webhook Personnel",
          "webhookId": webhookPath
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
                "node": `Agent IA - ${userEmail}`,
                "type": "ai_languageModel",
                "index": 0
              }
            ]
          ]
        },
        [`Agent IA - ${userEmail}`]: {
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
        "Retrieve Client Documents": {
          "ai_tool": [
            [
              {
                "node": `Agent IA - ${userEmail}`,
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
                "node": "Retrieve Client Documents",
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
                "node": "Retrieve Client Documents",
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
        "Webhook Personnel": {
          "main": [
            [
              {
                "node": `Agent IA - ${userEmail}`,
                "type": "main",
                "index": 0
              }
            ]
          ]
        }
      },
      "active": false,
      "settings": {
        "executionOrder": "v1"
      },
      "staticData": null,
      "tags": [
        {
          "name": "norbert",
          "id": "norbert-tag"
        },
        {
          "name": userEmail,
          "id": `client-${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}`
        }
      ],
      "triggerCount": 1,
      "versionId": null
    };

    // Créer le workflow avec l'API REST N8N
    console.log('📝 Création du workflow N8N personnalisé dans le dossier Norbert...');
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
      console.error('❌ Erreur création workflow N8N:', errorText);
      throw new Error(`Erreur création workflow: ${createResponse.statusText} - ${errorText}`);
    }

    const workflow = await createResponse.json();
    console.log('✅ Workflow N8N personnalisé créé avec ID:', workflow.id, 'pour:', userEmail);

    // Activer le workflow
    console.log('🔄 Activation du workflow N8N personnalisé...');
    const activateResponse = await fetch(`${N8N_BASE_URL}/rest/workflows/${workflow.id}/activate`, {
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

    console.log('✅ Workflow N8N personnalisé activé avec succès pour:', userEmail);

    return new Response(JSON.stringify({
      success: true,
      workflow_id: workflow.id,
      webhook_url: `${N8N_BASE_URL}/webhook/${webhookPath}`,
      folder_id: NORBERT_FOLDER_ID,
      client_email: userEmail,
      message: `Workflow N8N personnalisé créé et activé pour ${userEmail}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE création workflow N8N personnalisé:', error);
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
