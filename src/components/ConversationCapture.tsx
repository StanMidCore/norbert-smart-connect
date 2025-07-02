
import { useEffect } from 'react';
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

  useEffect(() => {
    if (userMessage) {
      console.log('📝 Capture message utilisateur:', userMessage);
      console.log('🔗 Webhook activé:', isEnabled, 'URL:', webhookUrl);
      captureConversation('user', userMessage, context);
    }
  }, [userMessage, context, captureConversation, isEnabled, webhookUrl]);

  useEffect(() => {
    if (aiResponse) {
      console.log('🤖 Capture réponse IA:', aiResponse);
      console.log('🔗 Webhook activé:', isEnabled, 'URL:', webhookUrl);
      captureConversation('ai', aiResponse, context);
    }
  }, [aiResponse, context, captureConversation, isEnabled, webhookUrl]);

  // Afficher un indicateur visuel si le webhook est activé
  if (isEnabled && webhookUrl) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
        🔄 Webhook N8N actif
      </div>
    );
  }

  return null;
};

export default ConversationCapture;
