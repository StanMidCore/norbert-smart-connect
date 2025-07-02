
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
  const lastProcessedRef = useRef({ userMessage: '', aiResponse: '', context: '' });

  useEffect(() => {
    // Éviter la boucle infinie en vérifiant si le message a changé
    if (userMessage && 
        userMessage !== lastProcessedRef.current.userMessage && 
        isEnabled && 
        webhookUrl) {
      
      const messageKey = `user-${userMessage}-${context || 'default'}`;
      
      if (!processedMessages.current.has(messageKey)) {
        processedMessages.current.add(messageKey);
        lastProcessedRef.current.userMessage = userMessage;
        console.log('📝 Capture message utilisateur:', userMessage);
        captureConversation('user', userMessage, context);
      }
    }
  }, [userMessage, context, captureConversation, isEnabled, webhookUrl]);

  useEffect(() => {
    // Éviter la boucle infinie en vérifiant si le message a changé
    if (aiResponse && 
        aiResponse !== lastProcessedRef.current.aiResponse && 
        isEnabled && 
        webhookUrl) {
      
      const messageKey = `ai-${aiResponse}-${context || 'default'}`;
      
      if (!processedMessages.current.has(messageKey)) {
        processedMessages.current.add(messageKey);
        lastProcessedRef.current.aiResponse = aiResponse;
        console.log('🤖 Capture réponse IA:', aiResponse);
        captureConversation('ai', aiResponse, context);
      }
    }
  }, [aiResponse, context, captureConversation, isEnabled, webhookUrl]);

  // Nettoyer le cache périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      processedMessages.current.clear();
      lastProcessedRef.current = { userMessage: '', aiResponse: '', context: '' };
      console.log('🧹 Cache de messages nettoyé');
    }, 300000); // Nettoyer toutes les 5 minutes

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
