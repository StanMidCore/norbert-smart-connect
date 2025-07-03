import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, Search, Bug, Download, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tables } from '@/integrations/supabase/types';
import RealTimeLogConsole from '@/components/RealTimeLogConsole';
import DebugExportPanel from '@/components/DebugExportPanel';
import { toast } from 'sonner';

type LogEntry = Tables<'edge_function_logs'>;

const LogsViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [exportReport, setExportReport] = useState('');
  const [exportPeriod, setExportPeriod] = useState('24h');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('edge_function_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (selectedFunction !== 'all') {
        query = query.eq('function_name', selectedFunction);
      }

      if (selectedLevel !== 'all') {
        query = query.eq('level', selectedLevel);
      }

      if (searchTerm) {
        query = query.or(`event.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur récupération logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedFunction, selectedLevel, searchTerm]);

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const clearLogs = async () => {
    try {
      const { error } = await supabase
        .from('edge_function_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (!error) {
        await fetchLogs();
      }
    } catch (error) {
      console.error('Erreur suppression logs:', error);
    }
  };

  const anonymizeEmail = (email: string | null): string => {
    if (!email) return 'anonymous';
    const domain = email.split('@')[1] || 'unknown.com';
    const hash = email.split('@')[0].slice(0, 3);
    return `user_${hash}***@${domain}`;
  };

  const anonymizeData = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key', 'access_token', 'refresh_token'];
    const result: any = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
      
      if (isSensitive && typeof value === 'string') {
        result[key] = `[MASKED_${value.length}_CHARS]`;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = anonymizeData(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  };

  const generateReport = async () => {
    try {
      const hours = exportPeriod === '24h' ? 24 : exportPeriod === '7d' ? 168 : 8760;
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);
      
      const { data: reportLogs, error } = await supabase
        .from('edge_function_logs')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const anonymizedLogs = reportLogs?.map(log => ({
        id: log.id,
        function_name: log.function_name,
        event: log.event,
        level: log.level,
        created_at: log.created_at,
        user_email: anonymizeEmail(log.user_email),
        details: anonymizeData(log.details)
      })) || [];

      const errorLogs = anonymizedLogs.filter(l => l.level === 'error');
      const warnLogs = anonymizedLogs.filter(l => l.level === 'warn');
      const functionsActivity = anonymizedLogs.reduce((acc, log) => {
        acc[log.function_name] = (acc[log.function_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const report = `# Rapport de Debug - Norbert AI

## Contexte de l'Application
- **Nom**: Norbert AI Assistant
- **Stack**: React/TypeScript + Supabase
- **Période analysée**: ${exportPeriod === '24h' ? 'Dernières 24h' : exportPeriod === '7d' ? 'Derniers 7 jours' : 'Dernier mois'}
- **Timestamp**: ${new Date().toISOString()}

## Résumé des Erreurs
- **Erreurs**: ${errorLogs.length}
- **Warnings**: ${warnLogs.length}
- **Total logs**: ${anonymizedLogs.length}

## Activité par Fonction
${Object.entries(functionsActivity)
  .sort(([,a], [,b]) => b - a)
  .map(([fn, count]) => `- ${fn}: ${count} logs`)
  .join('\n')}

## Dernières Erreurs (Top 10)
${errorLogs.slice(0, 10).map(error => `
### ${error.function_name} - ${error.event}
- **Timestamp**: ${error.created_at}
- **User**: ${error.user_email}
- **Details**: ${JSON.stringify(error.details, null, 2)}
`).join('\n')}

## Logs Détaillés (50 derniers)
${anonymizedLogs.slice(0, 50).map(log => `
[${log.created_at}] ${log.level?.toUpperCase()} - ${log.function_name}: ${log.event}
User: ${log.user_email}
Details: ${JSON.stringify(log.details, null, 2)}
`).join('\n---\n')}

---
*Rapport généré automatiquement par Norbert Debug System*
`;

      setExportReport(report);
      toast.success('Rapport généré avec succès');
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      toast.error('Erreur lors de la génération du rapport');
    }
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(exportReport);
      toast.success('Rapport copié dans le presse-papier');
    } catch (error) {
      console.error('Erreur copie:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Centre de Debug Avancé</h1>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={clearLogs} variant="destructive" size="sm">
            Vider les logs
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visualization" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visualization">Visualisation</TabsTrigger>
          <TabsTrigger value="realtime">Temps Réel</TabsTrigger>
          <TabsTrigger value="export">Export pour Claude</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="space-y-6">
          {/* Filtres */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les événements ou emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedFunction} onValueChange={setSelectedFunction}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les fonctions</SelectItem>
                <SelectItem value="stripe-success">stripe-success</SelectItem>
                <SelectItem value="cleanup-channels">cleanup-channels</SelectItem>
                <SelectItem value="connect-unipile-account">connect-unipile-account</SelectItem>
                <SelectItem value="unipile-accounts">unipile-accounts</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous niveaux</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des logs */}
          <Card>
            <CardHeader>
              <CardTitle>Logs récents ({logs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {loading ? (
                  <div className="text-center py-8">Chargement des logs...</div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun log trouvé
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log, index) => (
                      <div key={log.id}>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={getLevelColor(log.level)}>
                                {log.level?.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {log.function_name}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatTime(log.created_at)}
                              </span>
                            </div>
                            <div className="font-medium">
                              {log.event}
                            </div>
                            {log.user_email && (
                              <div className="text-sm text-muted-foreground">
                                👤 {log.user_email}
                              </div>
                            )}
                            {log.details && Object.keys(log.details).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-sm text-muted-foreground cursor-pointer">
                                  Détails
                                </summary>
                                <pre className="mt-1 text-xs bg-background p-2 rounded border overflow-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                        {index < logs.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime">
          <RealTimeLogConsole />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export pour Claude
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Période</label>
                  <Select value={exportPeriod} onValueChange={setExportPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Dernières 24h</SelectItem>
                      <SelectItem value="7d">Derniers 7 jours</SelectItem>
                      <SelectItem value="30d">Dernier mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={generateReport} variant="default">
                    Générer Rapport
                  </Button>
                  <Button onClick={copyReport} variant="outline" disabled={!exportReport}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Rapport pour Claude</label>
                <Textarea
                  value={exportReport}
                  onChange={(e) => setExportReport(e.target.value)}
                  placeholder="Cliquez sur 'Générer Rapport' pour créer un rapport formaté..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                💡 Ce rapport contient les logs anonymisés et le contexte nécessaire pour que Claude puisse vous aider efficacement.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Analyse des Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {logs.filter(l => l.level === 'error').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Erreurs</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {logs.filter(l => l.level === 'warn').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {logs.filter(l => l.level === 'info').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Info</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center text-muted-foreground">
                Utilisez l'onglet "Export pour Claude" pour générer un rapport détaillé
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LogsViewer;
