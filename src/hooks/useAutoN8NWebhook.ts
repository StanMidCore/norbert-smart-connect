
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConversationEntry {
  timestamp: string;
  role: 'user' | 'ai';
  content: string;
  context?: string;
}

export const useAutoN8NWebhook = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);

  // Charger la configuration depuis localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('n8n_webhook_url');
    const savedEnabled = localStorage.getItem('n8n_auto_enabled');
    
    if (savedUrl) {
      setWebhookUrl(savedUrl);
      console.log('🔗 URL webhook chargée:', savedUrl);
    }
    if (savedEnabled === 'true') {
      setIsEnabled(true);
      console.log('✅ Webhook automatique activé');
    }
  }, []);

  // Sauvegarder la configuration
  const saveConfig = (url: string, enabled: boolean) => {
    localStorage.setItem('n8n_webhook_url', url);
    localStorage.setItem('n8n_auto_enabled', enabled.toString());
    setWebhookUrl(url);
    setIsEnabled(enabled);
    console.log('💾 Configuration sauvée:', { url, enabled });
  };

  // Capturer une conversation
  const captureConversation = (role: 'user' | 'ai', content: string, context?: string) => {
    console.log('📨 Tentative capture conversation:', { role, content, context, isEnabled, webhookUrl });
    
    if (!isEnabled || !webhookUrl) {
      console.log('⚠️ Capture ignorée - webhook non configuré');
      return;
    }

    const entry: ConversationEntry = {
      timestamp: new Date().toISOString(),
      role,
      content,
      context
    };

    setConversations(prev => {
      const updated = [...prev, entry];
      
      // Envoyer immédiatement si c'est une réponse IA complète
      if (role === 'ai') {
        console.log('🚀 Envoi conversation vers N8N...');
        sendConversationToN8N(updated.slice(-2)); // Envoyer les 2 derniers messages (user + ai)
      }
      
      return updated.slice(-50); // Garder seulement les 50 derniers
    });
  };

  // Envoyer une conversation vers N8N
  const sendConversationToN8N = async (conversationSlice: ConversationEntry[]) => {
    if (!isEnabled || !webhookUrl) {
      console.log('⚠️ Envoi ignoré - webhook non configuré');
      return;
    }

    console.log('📤 Envoi vers N8N:', conversationSlice);

    try {
      const { data, error } = await supabase.functions.invoke('send-to-n8n-webhook', {
        body: {
          type: 'conversation',
          data: {
            conversations: conversationSlice,
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'lovable-auto-capture',
              session_id: sessionStorage.getItem('session_id') || 'unknown'
            }
          },
          webhookUrl: webhookUrl
        }
      });

      if (error) throw error;
      
      console.log('✅ Conversation envoyée vers N8N avec succès:', data);
    } catch (error) {
      console.error('❌ Erreur envoi conversation auto vers N8N:', error);
    }
  };

  // Envoyer les logs automatiquement
  const sendLogsToN8N = async (hours: number = 1) => {
    if (!isEnabled || !webhookUrl) {
      console.log('⚠️ Envoi logs ignoré - webhook non configuré');
      return;
    }

    console.log('📊 Envoi logs vers N8N...');

    try {
      const { data, error } = await supabase.functions.invoke('export-logs-to-n8n', {
        body: {
          webhookUrl: webhookUrl,
          hours: hours,
          functions: [] // Toutes les fonctions
        }
      });

      if (error) throw error;
      
      console.log('✅ Logs envoyés vers N8N avec succès:', data);
    } catch (error) {
      console.error('❌ Erreur envoi logs auto vers N8N:', error);
    }
  };

  return {
    isEnabled,
    webhookUrl,
    conversations,
    saveConfig,
    captureConversation,
    sendLogsToN8N
  };
};
