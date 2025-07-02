
import { useEffect, useRef } from 'react';
import { useAutoN8NWebhook } from '@/hooks/useAutoN8NWebhook';

interface ConversationCaptureProps {
  userMessage?: string;
  aiResponse?: string;
  context?: string;
}

const ConversationCapture: React.FC<ConversationCaptureProps> = ({
  userMessage,
  aiResponse,
  context
}) => {
  const { captureConversation, isEnabled, webhookUrl } = useAutoN8NWebhook();
  const processedMessages = useRef(new Set<string>());

  useEffect(() => {
    if (userMessage && isEnabled && webhookUrl) {
      const messageKey = `user-${userMessage}-${context}-${Date.now()}`;
      
      if (!processedMessages.current.has(messageKey)) {
        processedMessages.current.add(messageKey);
        console.log('📝 Capture message utilisateur:', userMessage);
        console.log('🔗 Webhook activé:', isEnabled, 'URL:', webhookUrl);
        captureConversation('user', userMessage, context);
      }
    }
  }, [userMessage, context, captureConversation, isEnabled, webhookUrl]);

  useEffect(() => {
    if (aiResponse && isEnabled && webhookUrl) {
      const messageKey = `ai-${aiResponse}-${context}-${Date.now()}`;
      
      if (!processedMessages.current.has(messageKey)) {
        processedMessages.current.add(messageKey);
        console.log('🤖 Capture réponse IA:', aiResponse);
        console.log('🔗 Webhook activé:', isEnabled, 'URL:', webhookUrl);
        captureConversation('ai', aiResponse, context);
      }
    }
  }, [aiResponse, context, captureConversation, isEnabled, webhookUrl]);

  // Nettoyer le cache périodiquement pour éviter l'accumulation
  useEffect(() => {
    const interval = setInterval(() => {
      processedMessages.current.clear();
    }, 60000); // Nettoyer toutes les minutes

    return () => clearInterval(interval);
  }, []);

  // Afficher un indicateur visuel si le webhook est activé
  if (isEnabled && webhookUrl) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-2 py-1 rounded text-xs z-50">
        🔄 Webhook N8N actif
      </div>
    );
  }

  return null;
};

export default ConversationCapture;
