
import N8NWebhookManager from '@/components/N8NWebhookManager';

const N8NWebhook = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Intégration N8N Webhook
          </h1>
          <p className="text-gray-600 mt-2">
            Envoyez vos conversations et logs vers N8N pour analyse par votre agent IA
          </p>
        </div>
        
        <N8NWebhookManager />
      </div>
    </div>
  );
};

export default N8NWebhook;
