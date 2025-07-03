
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Pause, Play, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { copyToClipboard } from '@/utils/debugUtils';
import { toast } from 'sonner';

type LogEntry = Tables<'edge_function_logs'>;

interface RealTimeLogConsoleProps {
  maxLogs?: number;
  autoScroll?: boolean;
}

const RealTimeLogConsole = ({ maxLogs = 100, autoScroll = true }: RealTimeLogConsoleProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['error', 'warn', 'info']);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const channel = supabase
      .channel('realtime-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'edge_function_logs'
        },
        (payload) => {
          const newLog = payload.new as LogEntry;
          setLogs(prev => {
            const updated = [newLog, ...prev];
            return updated.slice(0, maxLogs);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isActive, maxLogs]);

  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => 
    selectedLevels.includes(log.level || 'info')
  );

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
    return new Date(timestamp).toLocaleTimeString('fr-FR');
  };

  const handleCopyLogs = async () => {
    const logsText = filteredLogs.map(log => 
      `[${formatTime(log.created_at)}] ${log.level?.toUpperCase()} - ${log.function_name}: ${log.event}`
    ).join('\n');
    
    const success = await copyToClipboard(logsText);
    toast(success ? 'Logs copiés!' : 'Erreur lors de la copie');
  };

  const clearLogs = () => {
    setLogs([]);
    toast('Console vidée');
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Console de Debug Temps Réel</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsActive(!isActive)}
              variant="outline"
              size="sm"
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button onClick={handleCopyLogs} variant="outline" size="sm">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={clearLogs} variant="outline" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          {['error', 'warn', 'info', 'debug'].map(level => (
            <Button
              key={level}
              onClick={() => toggleLevel(level)}
              variant={selectedLevels.includes(level) ? "default" : "outline"}
              size="sm"
              className="h-6 text-xs"
            >
              {level}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-64" ref={scrollAreaRef}>
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {isActive ? 'En attente de nouveaux logs...' : 'Console en pause'}
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 p-2 rounded bg-muted/30 text-sm">
                  <span className="text-muted-foreground text-xs min-w-16">
                    {formatTime(log.created_at)}
                  </span>
                  <Badge variant={getLevelColor(log.level)} className="text-xs">
                    {log.level?.toUpperCase()}
                  </Badge>
                  <span className="font-medium text-xs">{log.function_name}</span>
                  <span className="text-xs flex-1">{log.event}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RealTimeLogConsole;
