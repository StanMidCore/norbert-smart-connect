import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Diagnostic N8N au startup
console.log('🚀 === DIAGNOSTIC N8N STARTUP ===');
const N8N_BASE_URL = Deno.env.get('N8N_BASE_URL');
const N8N_API_KEY = Deno.env.get('N8N_API_KEY');
console.log('N8N_BASE_URL:', N8N_BASE_URL || 'MANQUANT');
console.log('N8N_API_KEY:', N8N_API_KEY ? 'PRÉSENT' : 'MANQUANT');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_API_KEY_CONST = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2E5NWQ2NS1kZTI5LTRlN2EtYjQxZC0yYjhjZTdiYTQwYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxMDExNzgxfQ.k4c-dAmKJpK5aUk2idyW1HFNmayS3xba4PrbUGa88CY';
const N8N_BASE_URL_CONST = 'https://n8n.srv784558.hstgr.cloud';
const NORBERT_FOLDER_ID = 'uO7pivHjhurjrT2k';

serve(async (req) => {
  console.log('🎯 === DÉBUT FONCTION create-n8n-workflow ===');
  console.log(`📨 Méthode: ${req.method}`);
  console.log(`🔗 URL: ${req.url}`);

  // Diagnostic détaillé au début
  console.log('🔑 === DIAGNOSTIC CREATE-N8N-WORKFLOW ===');
  console.log('N8N_BASE_URL:', Deno.env.get('N8N_BASE_URL') ? 'PRÉSENT' : 'MANQUANT');
  console.log('N8N_API_KEY:', Deno.env.get('N8N_API_KEY') ? 'PRÉSENT' : 'MANQUANT'); 
  console.log('NORBERT_FOLDER_ID:', Deno.env.get('NORBERT_FOLDER_ID') ? 'PRÉSENT' : 'MANQUANT');

  // Test de connectivité N8N
  try {
    console.log('🏥 Test de connectivité N8N...');
    const testResponse = await fetch(`${N8N_BASE_URL_CONST}/rest/health`, {
      headers: { 'Authorization': `Bearer ${N8N_API_KEY_CONST}` }
    });
    console.log('🏥 Test santé N8N:', testResponse.status, testResponse.statusText);
  } catch (testError) {
    console.error('❌ Erreur connectivité N8N:', testError.message);
  }

  // Logging des variables d'environnement
  console.log('🔑 Variables d\'environnement:');
  console.log('N8N_BASE_URL:', N8N_BASE_URL ? 'PRÉSENT' : 'MANQUANT');
  console.log('N8N_API_KEY:', N8N_API_KEY ? 'PRÉSENT' : 'MANQUANT');
  console.log('NORBERT_FOLDER_ID:', NORBERT_FOLDER_ID ? 'PRÉSENT' : 'MANQUANT');
  
  if (req.method === 'OPTIONS') {
    console.log('⚡ Réponse OPTIONS CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Lecture du body de la requête...');
    const body = await req.json();
    console.log('📊 Body reçu:', JSON.stringify(body, null, 2));
    
    const { userEmail, userName } = body;
    console.log(`🚀 CRÉATION WORKFLOW N8N PERSONNALISÉ - Email: ${userEmail}, Nom: ${userName}`);

    if (!userEmail || !userName) {
      console.error('❌ Paramètres manquants:', { userEmail, userName });
      throw new Error('Email et nom utilisateur requis');
    }

    // Générer un webhook unique basé sur l'email du client
    const webhookPath = `${userEmail.replace(/[^a-zA-Z0-9]/g, '-')}-webhook`;
    console.log(`🔗 Webhook personnalisé généré: ${webhookPath}`);

    // Construire l'URL complète du webhook
    const webhookUrl = `${N8N_BASE_URL_CONST}/webhook/${webhookPath}`;
    console.log(`🌐 URL webhook complète: ${webhookUrl}`);

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

    console.log('📄 Workflow data préparé');
    console.log(`📊 Taille du workflow: ${JSON.stringify(workflowData).length} caractères`);

    // Créer le workflow avec l'API REST N8N
    console.log('📝 Envoi requête POST vers N8N...');
    console.log(`🔗 URL: ${N8N_BASE_URL_CONST}/rest/workflows`);
    console.log(`🔑 Authorization: Bearer ${N8N_API_KEY_CONST.substring(0, 20)}...`);
    
    const createResponse = await fetch(`${N8N_BASE_URL_CONST}/rest/workflows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY_CONST}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });

    console.log(`📡 Réponse N8N: ${createResponse.status} ${createResponse.statusText}`);

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Erreur détaillée N8N:', errorText);
      console.error('❌ Status:', createResponse.status);
      console.error('❌ Headers:', Object.fromEntries(createResponse.headers.entries()));
      throw new Error(`Erreur création workflow: ${createResponse.statusText} - ${errorText}`);
    }

    const workflow = await createResponse.json();
    console.log('✅ Workflow créé avec succès!');
    console.log(`🆔 ID du workflow: ${workflow.id}`);
    console.log(`📧 Nom du workflow: ${workflow.name}`);

    // Activer le workflow
    console.log('🔄 Activation du workflow...');
    const activateResponse = await fetch(`${N8N_BASE_URL_CONST}/rest/workflows/${workflow.id}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${N8N_API_KEY_CONST}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`🔌 Réponse activation: ${activateResponse.status} ${activateResponse.statusText}`);

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      console.error('❌ Erreur activation:', errorText);
      throw new Error(`Erreur activation workflow: ${activateResponse.statusText} - ${errorText}`);
    }

    console.log('✅ Workflow activé avec succès!');

    const responseData = {
      success: true,
      workflow_id: workflow.id,
      webhook_url: webhookUrl,
      folder_id: NORBERT_FOLDER_ID,
      client_email: userEmail,
      message: `Workflow N8N personnalisé créé et activé pour ${userEmail}`
    };

    console.log('📤 Réponse finale:', JSON.stringify(responseData, null, 2));
    console.log('🎯 === FIN FONCTION create-n8n-workflow ===');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ERREUR CRITIQUE create-n8n-workflow:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Message:', error.message);
    
    const errorResponse = {
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Réponse d\'erreur:', JSON.stringify(errorResponse, null, 2));
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
