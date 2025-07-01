
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Webhook, 
  Send, 
  FileText, 
  Clock, 
  Settings,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

const N8NWebhookManager = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [conversationData, setConversationData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const { toast } = useToast();

  const sendConversationData = async () => {
    if (!webhookUrl || !conversationData) {
      toast({
        title: "Données manquantes",
        description: "Veuillez renseigner l'URL webhook et les données de conversation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-to-n8n-webhook', {
        body: {
          type: 'conversation',
          data: {
            conversation: conversationData,
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'lovable-chat',
              user_input: true
            }
          },
          webhookUrl: webhookUrl
        }
      });

      if (error) throw error;

      setLastSent(new Date().toISOString());
      toast({
        title: "✅ Envoyé avec succès",
        description: "Les données de conversation ont été envoyées vers N8N",
      });
      setConversationData('');
    } catch (error) {
      console.error('Erreur envoi conversation:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible d'envoyer les données vers N8N",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = async (hours: number = 24) => {
    if (!webhookUrl) {
      toast({
        title: "URL manquante",
        description: "Veuillez renseigner l'URL webhook N8N",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-logs-to-n8n', {
        body: {
          webhookUrl: webhookUrl,
          hours: hours,
          functions: [] // Toutes les fonctions
        }
      });

      if (error) throw error;

      toast({
        title: "✅ Logs exportés",
        description: `${data.summary?.total_logs || 0} logs envoyés vers N8N`,
      });
    } catch (error) {
      console.error('Erreur export logs:', error);
      toast({
        title: "❌ Erreur",
        description: "Impossible d'exporter les logs vers N8N",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Configuration Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Webhook className="h-5 w-5" />
            <span>Configuration Webhook N8N</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-url">URL Webhook N8N</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          
          {lastSent && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Dernier envoi: {new Date(lastSent).toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Envoi de conversations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Envoyer une conversation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="conversation">Données de conversation</Label>
            <Textarea
              id="conversation"
              placeholder="Collez ici la conversation à analyser par votre agent IA..."
              value={conversationData}
              onChange={(e) => setConversationData(e.target.value)}
              rows={6}
            />
          </div>
          
          <Button 
            onClick={sendConversationData}
            disabled={isLoading || !webhookUrl || !conversationData}
            className="w-full"
          >
            {isLoading ? 'Envoi...' : 'Envoyer vers N8N'}
          </Button>
        </CardContent>
      </Card>

      {/* Export des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Export des logs Edge Functions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Exportez tous les logs des edge functions vers N8N pour analyse
          </p>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => exportLogs(1)}
              disabled={isLoading || !webhookUrl}
              variant="outline"
              size="sm"
            >
              <Clock className="h-4 w-4 mr-1" />
              1h
            </Button>
            <Button 
              onClick={() => exportLogs(24)}
              disabled={isLoading || !webhookUrl}
              variant="outline" 
              size="sm"
            >
              <Clock className="h-4 w-4 mr-1" />
              24h
            </Button>
            <Button 
              onClick={() => exportLogs(168)}
              disabled={isLoading || !webhookUrl}
              variant="outline"
              size="sm"
            >
              <Clock className="h-4 w-4 mr-1" />
              7j
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Informations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Badge variant="outline">Format JSON</Badge>
            <p className="text-sm text-gray-600">
              Les données sont envoyées en JSON avec timestamp et métadonnées
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge variant="outline">Types de données</Badge>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Conversations Lovable → N8N</li>
              <li>• Logs des edge functions</li>
              <li>• Métadonnées et timestamps</li>
            </ul>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <strong>Tip:</strong> Configurez votre workflow N8N pour recevoir des webhooks POST avec du JSON. 
                Utilisez les données reçues pour alimenter votre agent IA d'analyse.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default N8NWebhookManager;
