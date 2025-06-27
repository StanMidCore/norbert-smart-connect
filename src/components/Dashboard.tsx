
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Bell,
  Settings,
  Menu
} from 'lucide-react';

interface Message {
  id: string;
  from_name: string;
  from_number: string;
  body_preview: string;
  timestamp: string;
  urgent: boolean;
  requires_response: boolean;
  handled_by: 'IA' | 'human';
  response_status: 'pending' | 'sent' | 'failed';
  channel_type: 'whatsapp' | 'sms' | 'email' | 'facebook' | 'instagram';
}

interface Client {
  id: string;
  name: string;
  contact: string;
  channel: string;
  last_contact: string;
  message_count: number;
  status: 'active' | 'pending' | 'resolved';
}

const Dashboard = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from_name: 'Marie Dubois',
      from_number: '+33612345678',
      body_preview: 'Bonjour, j\'ai une fuite d\'eau dans ma salle de bain, pouvez-vous intervenir rapidement ?',
      timestamp: '2024-01-15T10:30:00Z',
      urgent: true,
      requires_response: true,
      handled_by: 'IA',
      response_status: 'sent',
      channel_type: 'whatsapp'
    },
    {
      id: '2',
      from_name: 'Pierre Martin',
      from_number: 'pierre.martin@email.com',
      body_preview: 'Demande de devis pour installation d\'une nouvelle cuisine',
      timestamp: '2024-01-15T09:15:00Z',
      urgent: false,
      requires_response: true,
      handled_by: 'IA',
      response_status: 'pending',
      channel_type: 'email'
    }
  ]);

  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'Marie Dubois',
      contact: '+33612345678',
      channel: 'WhatsApp',
      last_contact: '2024-01-15T10:30:00Z',
      message_count: 3,
      status: 'active'
    },
    {
      id: '2',
      name: 'Pierre Martin',
      contact: 'pierre.martin@email.com',
      channel: 'Email',
      last_contact: '2024-01-15T09:15:00Z',
      message_count: 1,
      status: 'pending'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'pending'>('all');

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.from_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.body_preview.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'urgent') return matchesSearch && message.urgent;
    if (selectedFilter === 'pending') return matchesSearch && message.response_status === 'pending';
    return matchesSearch;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return '💬';
      case 'email': return '📧';
      case 'sms': return '📱';
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      default: return '💬';
    }
  };

  const urgentMessagesCount = messages.filter(m => m.urgent && m.response_status === 'pending').length;
  const pendingMessagesCount = messages.filter(m => m.response_status === 'pending').length;
  const totalMessagesCount = messages.length;

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <div className="bg-header text-header px-4 py-3 pt-safe-offset-12 sm:pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-cta rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Dashboard Norbert</h1>
              <p className="text-sm opacity-90">Assistant IA activé</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-header hover:bg-white/10">
              <Bell className="h-5 w-5" />
              {urgentMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-alert text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {urgentMessagesCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="text-header hover:bg-white/10">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 pb-safe-offset-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-main">{totalMessagesCount}</div>
                <div className="text-sm text-gray-600">Messages</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-alert">{pendingMessagesCount}</div>
                <div className="text-sm text-gray-600">En attente</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-status-success">{clients.length}</div>
                <div className="text-sm text-gray-600">Clients</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un message ou un client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
              className={selectedFilter === 'all' ? 'bg-header text-header' : ''}
            >
              Tous
            </Button>
            <Button
              variant={selectedFilter === 'urgent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('urgent')}
              className={selectedFilter === 'urgent' ? 'bg-alert text-white' : ''}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Urgent
            </Button>
            <Button
              variant={selectedFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('pending')}
              className={selectedFilter === 'pending' ? 'bg-header text-header' : ''}
            >
              <Clock className="h-4 w-4 mr-1" />
              En attente
            </Button>
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-main">Messages récents</h2>
          
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <Card key={message.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getChannelIcon(message.channel_type)}</span>
                          <span className="font-medium text-main">{message.from_name}</span>
                          <span className="text-sm text-gray-500">{message.from_number}</span>
                          {message.urgent && (
                            <Badge className="bg-alert text-white text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                          {message.body_preview}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center space-x-3">
                            <span>{formatTimestamp(message.timestamp)}</span>
                            <span>Géré par {message.handled_by}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {message.response_status === 'sent' && (
                              <CheckCircle className="h-4 w-4 text-status-success" />
                            )}
                            {message.response_status === 'pending' && (
                              <Clock className="h-4 w-4 text-alert" />
                            )}
                            {message.response_status === 'failed' && (
                              <AlertTriangle className="h-4 w-4 text-alert" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-cta hover:bg-cta/90 text-white py-6">
            <Phone className="h-5 w-5 mr-2" />
            Appeler client
          </Button>
          <Button variant="outline" className="py-6 border-header text-header hover:bg-header hover:text-white">
            <User className="h-5 w-5 mr-2" />
            Nouveau client
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
