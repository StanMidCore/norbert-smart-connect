import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  MessageCircle, 
  Calendar, 
  Users, 
  Settings, 
  Mail, 
  MessageSquare, 
  Phone,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { Message } from '@/types/norbert';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  onClientDetail?: (clientId: string) => void;
}

const Dashboard = ({ onNavigate, onClientDetail }: DashboardProps) => {
  const [autopilotMode, setAutopilotMode] = useState(true);

  // Données de démo
  const stats = {
    totalMessages: 47,
    urgentMessages: 3,
    appointmentsToday: 2,
    manualResponses: 8
  };

  const recentMessages: Message[] = [
    {
      id: '1',
      user_id: 'user1',
      channel_id: 'whatsapp1',
      from_name: 'Marie Dubois',
      from_number: '+33123456789',
      body_preview: 'Bonjour, je souhaiterais un devis pour une rénovation de salle de bain...',
      urgent: true,
      requires_response: true,
      handled_by: 'IA',
      timestamp: new Date().toISOString(),
      response_status: 'pending'
    },
    {
      id: '2',
      user_id: 'user1',
      channel_id: 'email1',
      from_name: 'Pierre Martin',
      body_preview: 'Suite à notre conversation téléphonique, voici mes disponibilités...',
      urgent: false,
      requires_response: false,
      handled_by: 'IA',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      response_status: 'responded'
    },
    {
      id: '3',
      user_id: 'user1',
      channel_id: 'sms1',
      from_name: 'Sophie L.',
      from_number: '+33987654321',
      body_preview: 'URGENT : fuite d\'eau chez moi, pouvez-vous intervenir rapidement ?',
      urgent: true,
      requires_response: true,
      handled_by: 'user',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      response_status: 'pending'
    }
  ];

  const getChannelIcon = (channelId: string) => {
    if (channelId.includes('whatsapp')) return <MessageSquare className="h-4 w-4 text-green-600" />;
    if (channelId.includes('email')) return <Mail className="h-4 w-4 text-blue-600" />;
    if (channelId.includes('sms')) return <Phone className="h-4 w-4 text-purple-600" />;
    return <MessageCircle className="h-4 w-4" />;
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}min`;
    return `${hours}h`;
  };

  const handleMessageClick = (message: Message) => {
    // Simuler un ID client basé sur le nom
    const clientId = message.from_name.toLowerCase().replace(/\s+/g, '-');
    if (onClientDetail) {
      onClientDetail(clientId);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header avec safe area */}
      <div className="bg-header border-b border-gray-200 px-4 py-3 pt-safe-offset-12 sm:pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-cta p-2 rounded-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-header">Norbert</h1>
              <p className="text-xs text-header opacity-70">Assistant IA</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-header opacity-70">Mode</p>
              <p className="text-sm font-medium text-header">
                {autopilotMode ? 'Autopilot' : 'Manuel'}
              </p>
            </div>
            <Switch
              checked={autopilotMode}
              onCheckedChange={setAutopilotMode}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Messages</p>
                <p className="text-xl font-bold text-main">{stats.totalMessages}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Urgences</p>
                <p className="text-xl font-bold text-red-600">{stats.urgentMessages}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">RDV aujourd'hui</p>
                <p className="text-xl font-bold text-status-success">{stats.appointmentsToday}</p>
              </div>
              <Calendar className="h-8 w-8 text-status-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Réponses manuelles</p>
                <p className="text-xl font-bold text-main">{stats.manualResponses}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages récents */}
      <div className="p-4 pb-24">
        <h2 className="text-lg font-semibold mb-3 text-main">Messages récents</h2>
        <div className="space-y-3">
          {recentMessages.map((message) => (
            <Card 
              key={message.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMessageClick(message)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {getChannelIcon(message.channel_id)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-main">{message.from_name}</p>
                      <div className="flex items-center space-x-2">
                        {message.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            URGENT
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(message.timestamp)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {message.body_preview}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-2">
                        {message.response_status === 'responded' ? (
                          <CheckCircle className="h-4 w-4 text-status-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-alert" />
                        )}
                        <span className="text-xs text-gray-500">
                          Géré par {message.handled_by === 'IA' ? 'IA' : 'Vous'}
                        </span>
                      </div>
                      {message.requires_response && (
                        <Badge variant="outline" className="text-xs">
                          Réponse requise
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation Footer avec safe area */}
      <div className="fixed bottom-0 left-0 right-0 bg-header border-t border-gray-200 pb-safe-offset-6 sm:pb-2">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button 
            variant="ghost" 
            className="flex flex-col h-16 text-xs text-header hover:bg-header/80"
            onClick={() => onNavigate('dashboard')}
          >
            <MessageCircle className="h-6 w-6 mb-1" />
            Messages
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col h-16 text-xs text-header hover:bg-header/80"
            onClick={() => onNavigate('calendar')}
          >
            <Calendar className="h-6 w-6 mb-1" />
            Calendrier
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col h-16 text-xs text-header hover:bg-header/80"
            onClick={() => onNavigate('clients')}
          >
            <Users className="h-6 w-6 mb-1" />
            Clients
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col h-16 text-xs text-header hover:bg-header/80"
            onClick={() => onNavigate('settings')}
          >
            <Settings className="h-6 w-6 mb-1" />
            Réglages
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
