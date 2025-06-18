
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
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Norbert</h1>
              <p className="text-xs text-gray-500">Assistant IA</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Mode</p>
              <p className="text-sm font-medium">
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
                <p className="text-xl font-bold">{stats.totalMessages}</p>
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
                <p className="text-xl font-bold">{stats.appointmentsToday}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Réponses manuelles</p>
                <p className="text-xl font-bold">{stats.manualResponses}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages récents */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3">Messages récents</h2>
        <div className="space-y-3">
          {recentMessages.map((message) => (
            <Card key={message.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {getChannelIcon(message.channel_id)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{message.from_name}</p>
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
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-orange-600" />
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

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Button 
            variant="ghost" 
            className="flex flex-col h-16 text-xs"
            onClick={() => onNavigate('dashboard')}
          >
            <MessageCircle className="h-6 w-6 mb-1" />
            Messages
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col h-16 text-xs"
            onClick={() => onNavigate('calendar')}
          >
            <Calendar className="h-6 w-6 mb-1" />
            Calendrier
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col h-16 text-xs"
            onClick={() => onNavigate('clients')}
          >
            <Users className="h-6 w-6 mb-1" />
            Clients
          </Button>
          <Button 
            variant="ghost" 
            className="flex flex-col h-16 text-xs"
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
