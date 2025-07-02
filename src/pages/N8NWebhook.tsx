
import N8NWebhookManager from '@/components/N8NWebhookManager';
import AutoN8NWebhook from '@/components/AutoN8NWebhook';
import ConversationCapture from '@/components/ConversationCapture';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        
        <Tabs defaultValue="auto" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">🔄 Automatique</TabsTrigger>
            <TabsTrigger value="manual">🎛️ Manuel</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auto" className="space-y-6">
            <AutoN8NWebhook />
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-6">
            <N8NWebhookManager />
          </TabsContent>
        </Tabs>
        
        <ConversationCapture 
          userMessage="Utilisateur a accédé à la page N8N Webhook"
          aiResponse="Interface de configuration N8N affichée avec onglets automatique et manuel"
          context="n8n-webhook-page"
        />
      </div>
    </div>
  );
};

export default N8NWebhook;
