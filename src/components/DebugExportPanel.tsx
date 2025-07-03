
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Copy, 
  FileText, 
  Bug, 
  Clock,
  Shield
} from 'lucide-react';
import {
  exportLogsForClaude,
  generateContextReport,
  generateDebugTemplate,
  copyToClipboard
} from '@/utils/debugUtils';
import { toast } from 'sonner';

const DebugExportPanel = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportHours, setExportHours] = useState(24);
  const [problemDescription, setProblemDescription] = useState('');
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      const exportData = await exportLogsForClaude(exportHours);
      const success = await copyToClipboard(exportData);
      
      if (success) {
        setLastExport(new Date().toISOString());
        toast.success(`Logs des ${exportHours}h exportés et copiés!`);
      } else {
        // Fallback: download as file
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `norbert-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Logs téléchargés!');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export des logs');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportContext = async () => {
    try {
      const contextReport = await generateContextReport();
      const success = await copyToClipboard(contextReport);
      toast(success ? 'Rapport de contexte copié!' : 'Erreur lors de la copie');
    } catch (error) {
      toast.error('Erreur lors de la génération du contexte');
    }
  };

  const handleGenerateDebugTemplate = async () => {
    if (!problemDescription.trim()) {
      toast.error('Veuillez décrire le problème');
      return;
    }

    try {
      const exportData = await exportLogsForClaude(2); // Last 2 hours for template
      const logs = JSON.parse(exportData).logs;
      const template = generateDebugTemplate(problemDescription, logs);
      
      const success = await copyToClipboard(template);
      toast(success ? 'Template de debug copié!' : 'Erreur lors de la copie');
    } catch (error) {
      toast.error('Erreur lors de la génération du template');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Export des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export pour Claude
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hours">Période (heures)</Label>
            <Input
              id="hours"
              type="number"
              value={exportHours}
              onChange={(e) => setExportHours(Number(e.target.value))}
              min={1}
              max={168}
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={handleExportLogs}
            disabled={isExporting}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            {isExporting ? 'Export en cours...' : 'Exporter logs anonymisés'}
          </Button>
          
          {lastExport && (
            <div className="text-sm text-muted-foreground">
              Dernier export: {new Date(lastExport).toLocaleString('fr-FR')}
            </div>
          )}
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Données incluses:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Logs des {exportHours} dernières heures</li>
              <li>• Emails anonymisés (user_xxx@domain.com)</li>
              <li>• Clés API et tokens masqués</li>
              <li>• Résumé automatique des erreurs</li>
              <li>• Timeline d'activité</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Template de debug */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Template de Debug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="problem">Décrivez le problème</Label>
            <Textarea
              id="problem"
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              placeholder="Ex: L'utilisateur ne peut pas se connecter à WhatsApp, le QR code ne s'affiche pas..."
              className="mt-1 min-h-20"
            />
          </div>
          
          <Button 
            onClick={handleGenerateDebugTemplate}
            disabled={!problemDescription.trim()}
            className="w-full"
          >
            <Copy className="h-4 w-4 mr-2" />
            Générer template pour Claude
          </Button>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Template inclut:</h4>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li>• Description du problème</li>
              <li>• 5 dernières erreurs pertinentes</li>
              <li>• Contexte technique de l'app</li>
              <li>• Fonctions actives</li>
              <li>• Format optimisé pour Claude</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportContext} variant="outline">
              <Clock className="h-4 w-4 mr-2" />
              Rapport de contexte
            </Button>
            
            <Button 
              onClick={() => handleExportLogs()}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export rapide (24h)
            </Button>
            
            <Badge variant="secondary" className="px-3 py-1">
              Données automatiquement anonymisées
            </Badge>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 mb-2">💡 Comment utiliser avec Claude:</h4>
            <ol className="text-xs text-blue-800 space-y-1">
              <li>1. Décrivez votre problème dans le template</li>
              <li>2. Copiez le template généré</li>
              <li>3. Collez-le dans votre conversation avec Claude</li>
              <li>4. Claude aura tout le contexte nécessaire pour vous aider</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugExportPanel;
