
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAutoN8NWebhook } from '@/hooks/useAutoN8NWebhook';
import { 
  Zap, 
  Settings, 
  Clock, 
  MessageSquare,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AutoN8NWebhook = () => {
  const { toast } = useToast();
  const {
    isEnabled,
    webhookUrl,
    conversations,
    saveConfig,
    sendLogsToN8N
  } = useAutoN8NWebhook();

  const [localUrl, setLocalUrl] = useState(webhookUrl);
  const [localEnabled, setLocalEnabled] = useState(isEnabled);
  const [lastLogsSent, setLastLogsSent] = useState<string | null>(null);

  useEffect(() => {
    setLocalUrl(webhookUrl);
    setLocalEnabled(isEnabled);
  }, [webhookUrl, isEnabled]);

  // Envoyer les logs automatiquement toutes les heures si activé
  useEffect(() => {
    if (!isEnabled || !webhookUrl) return;

    const interval = setInterval(async () => {
      console.log('📤 Envoi automatique des logs vers N8N...');
      await sendLogsToN8N(1); // Dernière heure
      setLastLogsSent(new Date().toISOString());
    }, 60 * 60 * 1000); // Toutes les heures

    return () => clearInterval(interval);
  }, [isEnabled, webhookUrl, sendLogsToN8N]);

  const handleSave = () => {
    if (localEnabled && !localUrl) {
      toast({
        title: "URL requise",
        description: "Veuillez renseigner l'URL du webhook N8N",
        variant: "destructive",
      });
      return;
    }

    saveConfig(localUrl, localEnabled);
    
    toast({
      title: localEnabled ? "✅ Webhook automatique activé" : "⏸️ Webhook automatique désactivé",
      description: localEnabled 
        ? "Les conversations et logs seront envoyés automatiquement vers N8N"
        : "L'envoi automatique est maintenant désactivé",
    });
  };

  const handleManualLogsSend = async () => {
    if (!webhookUrl) {
      toast({
        title: "Configuration manquante",
        description: "Veuillez configurer et activer le webhook automatique",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendLogsToN8N(24); // Dernières 24h
      setLastLogsSent(new Date().toISOString());
      toast({
        title: "✅ Logs envoyés",
        description: "Les logs des dernières 24h ont été envoyés vers N8N",
      });
    } catch (error) {
      toast({
        title: "❌ Erreur",
        description: "Impossible d'envoyer les logs vers N8N",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Webhook Automatique N8N</span>
            {isEnabled ? (
              <Badge variant="default" className="ml-2">
                <CheckCircle className="h-3 w-3 mr-1" />
                Actif
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">
                <XCircle className="h-3 w-3 mr-1" />
                Inactif
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-url">URL Webhook N8N</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={localEnabled}
              onCheckedChange={setLocalEnabled}
            />
            <Label>Activer l'envoi automatique</Label>
          </div>

          <Button onClick={handleSave} className="w-full">
            Sauvegarder la configuration
          </Button>
        </CardContent>
      </Card>

      {/* Statistiques */}
      {isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Statistiques Automatiques</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-bold">{conversations.length}</div>
                <div className="text-sm text-gray-600">Conversations capturées</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-bold">1h</div>
                <div className="text-sm text-gray-600">Fréquence logs</div>
              </div>
            </div>

            {lastLogsSent && (
              <div className="text-sm text-gray-600 text-center">
                Derniers logs envoyés : {new Date(lastLogsSent).toLocaleString()}
              </div>
            )}

            <Button 
              onClick={handleManualLogsSend}
              variant="outline" 
              className="w-full"
            >
              Envoyer les logs manuellement (24h)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Informations */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnement Automatique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• <strong>Conversations :</strong> Envoyées immédiatement après chaque échange</p>
          <p>• <strong>Logs :</strong> Envoyés automatiquement toutes les heures</p>
          <p>• <strong>Format :</strong> JSON structuré avec métadonnées</p>
          <p>• <strong>Stockage :</strong> Configuration sauvée localement dans votre navigateur</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoN8NWebhook;
