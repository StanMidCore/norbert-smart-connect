
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw, Filter, Search, Bug, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tables } from '@/integrations/supabase/types';
import RealTimeLogConsole from '@/components/RealTimeLogConsole';
import DebugExportPanel from '@/components/DebugExportPanel';

type LogEntry = Tables<'edge_function_logs'>;

const LogsViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

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

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Logs Historiques</TabsTrigger>
          <TabsTrigger value="realtime">Temps Réel</TabsTrigger>
          <TabsTrigger value="export">Export pour Claude</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
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

        <TabsContent value="export">
          <DebugExportPanel />
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
