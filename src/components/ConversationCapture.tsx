
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
  const { captureConversation } = useAutoN8NWebhook();

  useEffect(() => {
    if (userMessage) {
      captureConversation('user', userMessage, context);
    }
  }, [userMessage, context, captureConversation]);

  useEffect(() => {
    if (aiResponse) {
      captureConversation('ai', aiResponse, context);
    }
  }, [aiResponse, context, captureConversation]);

  // Ce composant ne rend rien, il capture juste les conversations
  return null;
};

export default ConversationCapture;
