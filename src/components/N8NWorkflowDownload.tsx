
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Bot, Workflow, ArrowLeft } from 'lucide-react';

const N8NWorkflowDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const workflowData = {
    "name": "Norbert AI Agent - Multi-Canal",
    "nodes": [
      {
        "parameters": {
          "httpMethod": "POST",
          "path": "webhook-messages",
          "responseMode": "responseNode",
          "options": {}
        },
        "id": "webhook-multicanal",
        "name": "Webhook Multi-Canal",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 1,
        "position": [240, 300],
        "webhookId": "norbert-messages"
      },
      {
        "parameters": {
          "jsCode": "// Analyse et classification du message entrant\nconst message = $input.first().json.body;\nconst channel = $input.first().json.headers['x-channel-type'] || 'unknown';\nconst fromNumber = message.from_number || message.from_email || message.from_id;\nconst content = message.content || message.body || message.text;\n\n// Détection d'urgence par mots-clés\nconst urgentKeywords = ['urgent', 'emergency', 'fuite', 'panne', 'bloqué', 'dépannage', 'immédiat'];\nconst isUrgent = urgentKeywords.some(keyword => content.toLowerCase().includes(keyword));\n\n// Classification du type de demande\nlet requestType = 'general';\nif (content.toLowerCase().includes('devis') || content.toLowerCase().includes('prix')) {\n  requestType = 'quote';\n} else if (content.toLowerCase().includes('rendez-vous') || content.toLowerCase().includes('rdv')) {\n  requestType = 'appointment';\n} else if (isUrgent) {\n  requestType = 'emergency';\n}\n\nreturn {\n  channel_type: channel,\n  from_contact: fromNumber,\n  message_content: content,\n  is_urgent: isUrgent,\n  request_type: requestType,\n  timestamp: new Date().toISOString(),\n  raw_message: message\n};"
        },
        "id": "analyse-message",
        "name": "Analyse Message",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [460, 300]
      },
      {
        "parameters": {
          "model": "gpt-4",
          "messages": {
            "messageValues": [
              {
                "role": "system",
                "content": "Tu es Norbert, l'assistant IA spécialisé dans l'artisanat. Voici ton profil :\n\n**Ton rôle :**\n- Répondre aux clients de manière professionnelle et chaleureuse\n- Qualifier les demandes (urgent/normal)\n- Proposer des créneaux de rendez-vous\n- Donner des informations sur les services et tarifs\n- Escalader vers le propriétaire si nécessaire\n\n**Informations métier :**\n- Services : Installation sanitaire, réparation fuite, rénovation salle de bain, dépannage urgence\n- Disponibilités : Lundi-Vendredi 8h-18h, Samedi 9h-17h, urgences 24h/24\n- Tarifs : Déplacement 50€, taux horaire 65€, devis gratuit, supplément urgence weekend +30%\n\n**Instructions de réponse :**\n1. Sois toujours poli et professionnel\n2. Si urgence détectée : propose intervention rapide\n3. Pour devis : demande détails et propose RDV\n4. Pour RDV : propose 3 créneaux dans les 48h\n5. Termine toujours par une question engageante\n\n**Format de réponse :**\n- MESSAGE: [ta réponse au client]\n- ACTION: [quote/appointment/emergency/info]\n- PRIORITY: [high/medium/low]\n- NEXT_STEP: [ce que tu recommandes]"
              },
              {
                "role": "user",
                "content": "Message reçu via {{ $node.\"Analyse Message\".json.channel_type }} :\n\nDe : {{ $node.\"Analyse Message\".json.from_contact }}\nContenu : {{ $node.\"Analyse Message\".json.message_content }}\nUrgence détectée : {{ $node.\"Analyse Message\".json.is_urgent }}\nType de demande : {{ $node.\"Analyse Message\".json.request_type }}\n\nGénère une réponse appropriée en tant que Norbert."
              }
            ]
          },
          "options": {}
        },
        "id": "ia-norbert",
        "name": "IA Norbert",
        "type": "@n8n/n8n-nodes-langchain.openAi",
        "typeVersion": 1,
        "position": [680, 300],
        "credentials": {
          "openAiApi": {
            "id": "openai-norbert",
            "name": "OpenAI Norbert"
          }
        }
      },
      {
        "parameters": {
          "jsCode": "// Parse de la réponse IA\nconst aiResponse = $input.first().json.choices[0].message.content;\n\n// Extraction des sections de la réponse\nconst messageMatch = aiResponse.match(/MESSAGE:\\s*(.+?)(?=\\n|ACTION:|$)/s);\nconst actionMatch = aiResponse.match(/ACTION:\\s*(\\w+)/);\nconst priorityMatch = aiResponse.match(/PRIORITY:\\s*(\\w+)/);\nconst nextStepMatch = aiResponse.match(/NEXT_STEP:\\s*(.+?)$/s);\n\nconst response = {\n  message: messageMatch ? messageMatch[1].trim() : aiResponse,\n  action: actionMatch ? actionMatch[1] : 'info',\n  priority: priorityMatch ? priorityMatch[1] : 'medium',\n  next_step: nextStepMatch ? nextStepMatch[1].trim() : 'Attendre réponse client',\n  original_data: $node[\"Analyse Message\"].json,\n  timestamp: new Date().toISOString()\n};\n\nreturn response;"
        },
        "id": "parse-reponse",
        "name": "Parse Réponse IA",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [900, 300]
      },
      {
        "parameters": {
          "conditions": {
            "options": {
              "caseSensitive": true,
              "leftValue": "",
              "typeValidation": "strict"
            },
            "conditions": [
              {
                "id": "emergency",
                "leftValue": "{{ $node[\"Parse Réponse IA\"].json.action }}",
                "rightValue": "emergency",
                "operator": {
                  "type": "string",
                  "operation": "equals"
                }
              },
              {
                "id": "appointment",
                "leftValue": "{{ $node[\"Parse Réponse IA\"].json.action }}",
                "rightValue": "appointment",
                "operator": {
                  "type": "string",
                  "operation": "equals"
                }
              },
              {
                "id": "quote",
                "leftValue": "{{ $node[\"Parse Réponse IA\"].json.action }}",
                "rightValue": "quote",
                "operator": {
                  "type": "string",
                  "operation": "equals"
                }
              }
            ],
            "combinator": "or"
          },
          "fallbackOutput": "info"
        },
        "id": "routage-action",
        "name": "Routage Action",
        "type": "n8n-nodes-base.switch",
        "typeVersion": 3,
        "position": [1120, 300]
      },
      {
        "parameters": {
          "method": "POST",
          "url": "https://dmcgxjmkvqfyvsfsiexe.supabase.co/rest/v1/messages",
          "authentication": "predefinedCredentialType",
          "nodeCredentialType": "supabaseApi",
          "sendHeaders": true,
          "headerParameters": {
            "parameters": [
              {
                "name": "Content-Type",
                "value": "application/json"
              },
              {
                "name": "Prefer",
                "value": "return=representation"
              }
            ]
          },
          "sendBody": true,
          "bodyParameters": {
            "parameters": [
              {
                "name": "from_name",
                "value": "{{ $node[\"Parse Réponse IA\"].json.original_data.from_contact }}"
              },
              {
                "name": "from_number",
                "value": "{{ $node[\"Parse Réponse IA\"].json.original_data.from_contact }}"
              },
              {
                "name": "body_preview",
                "value": "{{ $node[\"Parse Réponse IA\"].json.original_data.message_content.substring(0, 100) }}"
              },
              {
                "name": "urgent",
                "value": "{{ $node[\"Parse Réponse IA\"].json.original_data.is_urgent }}"
              },
              {
                "name": "requires_response",
                "value": "true"
              },
              {
                "name": "handled_by",
                "value": "IA"
              },
              {
                "name": "response_status",
                "value": "responded"
              },
              {
                "name": "timestamp",
                "value": "{{ $node[\"Parse Réponse IA\"].json.timestamp }}"
              }
            ]
          }
        },
        "id": "save-message",
        "name": "Sauvegarder Message",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4,
        "position": [1340, 180],
        "credentials": {
          "supabaseApi": {
            "id": "supabase-norbert",
            "name": "Supabase Norbert"
          }
        }
      },
      {
        "parameters": {
          "jsCode": "// Gestion urgence - notification immédiate\nconst data = $node[\"Parse Réponse IA\"].json;\n\nreturn {\n  notification_type: 'emergency',\n  client_contact: data.original_data.from_contact,\n  message_preview: data.original_data.message_content.substring(0, 200),\n  channel: data.original_data.channel_type,\n  ai_response: data.message,\n  priority: 'HIGH',\n  timestamp: data.timestamp\n};"
        },
        "id": "urgence-notification",
        "name": "Notification Urgence",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1340, 80]
      },
      {
        "parameters": {
          "jsCode": "// Gestion RDV - création de créneaux proposés\nconst data = $node[\"Parse Réponse IA\"].json;\nconst now = new Date();\n\n// Génération de 3 créneaux dans les 48h\nconst slots = [];\nfor (let i = 1; i <= 3; i++) {\n  const slotDate = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000));\n  // Créneaux entre 9h et 17h\n  slotDate.setHours(9 + (i * 2), 0, 0, 0);\n  \n  slots.push({\n    start_time: slotDate.toISOString(),\n    end_time: new Date(slotDate.getTime() + (60 * 60 * 1000)).toISOString(), // 1h duration\n    status: 'proposed'\n  });\n}\n\nreturn {\n  client_contact: data.original_data.from_contact,\n  proposed_slots: slots,\n  ai_response: data.message,\n  channel: data.original_data.channel_type,\n  timestamp: data.timestamp\n};"
        },
        "id": "gestion-rdv",
        "name": "Gestion RDV",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1340, 300]
      },
      {
        "parameters": {
          "jsCode": "// Gestion devis - préparation des infos pour suivi\nconst data = $node[\"Parse Réponse IA\"].json;\n\nreturn {\n  client_contact: data.original_data.from_contact,\n  quote_request: data.original_data.message_content,\n  ai_response: data.message,\n  channel: data.original_data.channel_type,\n  status: 'info_requested',\n  follow_up_needed: true,\n  timestamp: data.timestamp\n};"
        },
        "id": "gestion-devis",
        "name": "Gestion Devis",
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [1340, 420]
      },
      {
        "parameters": {
          "method": "POST",
          "url": "{{ $node[\"Parse Réponse IA\"].json.original_data.webhook_response_url }}",
          "sendHeaders": true,
          "headerParameters": {
            "parameters": [
              {
                "name": "Content-Type",
                "value": "application/json"
              }
            ]
          },
          "sendBody": true,
          "bodyParameters": {
            "parameters": [
              {
                "name": "message",
                "value": "{{ $node[\"Parse Réponse IA\"].json.message }}"
              },
              {
                "name": "channel_type",
                "value": "{{ $node[\"Parse Réponse IA\"].json.original_data.channel_type }}"
              },
              {
                "name": "to",
                "value": "{{ $node[\"Parse Réponse IA\"].json.original_data.from_contact }}"
              },
              {
                "name": "priority",
                "value": "{{ $node[\"Parse Réponse IA\"].json.priority }}"
              }
            ]
          }
        },
        "id": "envoyer-reponse",
        "name": "Envoyer Réponse",
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4,
        "position": [1560, 300]
      }
    ],
    "connections": {
      "Webhook Multi-Canal": {
        "main": [
          [
            {
              "node": "Analyse Message",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Analyse Message": {
        "main": [
          [
            {
              "node": "IA Norbert",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "IA Norbert": {
        "main": [
          [
            {
              "node": "Parse Réponse IA",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Parse Réponse IA": {
        "main": [
          [
            {
              "node": "Routage Action",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Routage Action": {
        "main": [
          [
            {
              "node": "Notification Urgence",
              "type": "main",
              "index": 0
            },
            {
              "node": "Sauvegarder Message",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Gestion RDV",
              "type": "main",
              "index": 0
            },
            {
              "node": "Sauvegarder Message",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Gestion Devis",
              "type": "main",
              "index": 0
            },
            {
              "node": "Sauvegarder Message",
              "type": "main",
              "index": 0
            }
          ],
          [
            {
              "node": "Sauvegarder Message",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Sauvegarder Message": {
        "main": [
          [
            {
              "node": "Envoyer Réponse",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    "pinData": {},
    "settings": {
      "executionOrder": "v1"
    },
    "staticData": null,
    "tags": [
      {
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z",
        "id": "norbert-ai",
        "name": "Norbert AI"
      }
    ],
    "triggerCount": 1,
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "versionId": "1"
  };

  const handleDownload = () => {
    setIsDownloading(true);
    
    setTimeout(() => {
      try {
        // Convertir l'objet en JSON avec indentation
        const jsonString = JSON.stringify(workflowData, null, 2);
        
        // Créer un blob avec le contenu JSON
        const blob = new Blob([jsonString], { 
          type: 'application/json;charset=utf-8' 
        });
        
        // Créer une URL temporaire pour le blob
        const url = window.URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = 'norbert-ai-workflow.json';
        link.style.display = 'none';
        
        // Ajouter le lien au DOM, cliquer dessus, puis le supprimer
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Nettoyer l'URL temporaire
        window.URL.revokeObjectURL(url);
        
        console.log('Téléchargement du workflow N8N initié');
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        alert('Erreur lors du téléchargement. Veuillez réessayer.');
      } finally {
        setIsDownloading(false);
      }
    }, 100);
  };

  const handleBackToSettings = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header avec bouton retour */}
        <div className="flex items-center mb-6">
          <button 
            onClick={handleBackToSettings}
            className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Retour
          </button>
          <div className="flex-1 text-center">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Workflow className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Workflow N8N Norbert IA
            </h1>
            <p className="text-gray-600">
              Téléchargez le workflow complet pour votre instance N8N
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Agent IA Multi-Canal</span>
            </CardTitle>
            <CardDescription>
              Ce workflow inclut toutes les fonctionnalités de Norbert pour gérer vos communications clients
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Fonctionnalités incluses :</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Réception multi-canal</li>
                  <li>• Analyse intelligente des messages</li>
                  <li>• Agent IA personnalisé</li>
                  <li>• Détection d'urgence</li>
                  <li>• Gestion des rendez-vous</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Configuration requise :</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Clé API OpenAI</li>
                  <li>• Credentials Supabase</li>
                  <li>• Instance N8N active</li>
                  <li>• Webhooks configurés</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instructions d'installation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 text-sm text-gray-600">
              <li><strong>1.</strong> Téléchargez le fichier JSON ci-dessous</li>
              <li><strong>2.</strong> Dans N8N, cliquez sur "New Workflow" puis "Import from JSON"</li>
              <li><strong>3.</strong> Collez le contenu du fichier JSON téléchargé</li>
              <li><strong>4.</strong> Configurez vos credentials (OpenAI et Supabase)</li>
              <li><strong>5.</strong> Activez le workflow</li>
              <li><strong>6.</strong> Récupérez l'URL du webhook généré</li>
            </ol>
            
            <div className="mt-6 pt-4 border-t">
              <Button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isDownloading ? (
                  <>
                    <Workflow className="mr-2 h-4 w-4 animate-spin" />
                    Préparation du téléchargement...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le workflow N8N
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Le fichier téléchargé contient toute la logique nécessaire pour faire fonctionner Norbert IA dans votre environnement N8N
          </p>
        </div>
      </div>
    </div>
  );
};

export default N8NWorkflowDownload;
