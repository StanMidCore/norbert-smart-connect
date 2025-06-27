import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, Users, Calendar, Settings, Phone, Zap, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface DashboardProps {
  onNavigate: (screen: string) => void;
  onClientDetail: (clientId: string) => void;
}

const Dashboard = ({ onNavigate, onClientDetail }: DashboardProps) => {
  const [isSubscriptionActive] = useState(true);
  const [isWorkflowActive] = useState(true);
  
  const [profile] = useState({
    name: 'Stan Normand',
    company: 'Stokn',
    position: 'CEO',
  });
  
  const [channels] = useState([
    {
      name: 'WhatsApp',
      isConnected: true,
      lastMessage: 'Bonjour, comment puis-je vous aider ?',
      icon: '📱',
    },
    {
      name: 'Email',
      isConnected: true,
      lastMessage: 'Merci pour votre message.',
      icon: '✉️',
    },
    {
      name: 'Instagram',
      isConnected: false,
      lastMessage: null,
      icon: '📸',
    },
  ]);
  
  const [stats] = useState({
    totalMessages: 47,
    responseRate: 98,
    avgResponseTime: '2.3 min',
    activeClients: 12
  });

  const [recentMessages] = useState([
    {
      id: '1',
      client: 'Marie Dubois',
      message: 'Bonjour, je souhaiterais un devis pour...',
      time: '14:23',
      status: 'new',
      platform: 'email'
    },
    {
      id: '2', 
      client: 'Jean Martin',
      message: 'Merci pour votre réponse rapide !',
      time: '13:45',
      status: 'responded',
      platform: 'whatsapp'
    },
    {
      id: '3',
      client: 'Sophie Laurent',
      message: 'Pouvez-vous me rappeler demain ?',
      time: '12:30',
      status: 'urgent',
      platform: 'email'
    }
  ]);

  const handleClientClick = (clientId: string) => {
    onClientDetail(clientId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500 text-white">Nouveau</Badge>;
      case 'responded':
        return <Badge className="bg-status-success text-white">Répondu</Badge>;
      case 'urgent':
        return <Badge className="bg-alert text-white">Urgent</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp':
        return '📱';
      case 'email':
        return '✉️';
      case 'instagram':
        return '📸';
      default:
        return '💬';
    }
  };

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <div className="bg-header text-white p-4 pt-safe-offset-12">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Dashboard Norbert</h1>
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6" />
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">SN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-main">{stats.totalMessages}</p>
                  <p className="text-sm text-main opacity-70">Messages reçus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-status-success" />
                <div>
                  <p className="text-2xl font-bold text-main">{stats.responseRate}%</p>
                  <p className="text-sm text-main opacity-70">Taux de réponse</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-main">{stats.avgResponseTime}</p>
                  <p className="text-sm text-main opacity-70">Temps moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-main">{stats.activeClients}</p>
                  <p className="text-sm text-main opacity-70">Clients actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-main">Messages récents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMessages.map((message) => (
              <div 
                key={message.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => handleClientClick(message.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl">{getPlatformIcon(message.platform)}</div>
                  <div>
                    <p className="font-medium text-main">{message.client}</p>
                    <p className="text-sm text-main opacity-70 truncate max-w-48">
                      {message.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(message.status)}
                  <span className="text-xs text-main opacity-70">{message.time}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => onNavigate('calendar')}
            className="h-16 bg-white border border-gray-200 text-main hover:bg-gray-50 flex flex-col items-center justify-center space-y-1"
          >
            <Calendar className="h-6 w-6" />
            <span className="text-sm">Calendrier</span>
          </Button>

          <Button 
            onClick={() => onNavigate('clients')}
            className="h-16 bg-white border border-gray-200 text-main hover:bg-gray-50 flex flex-col items-center justify-center space-y-1"
          >
            <Users className="h-6 w-6" />
            <span className="text-sm">Clients</span>
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-header text-white p-4 pb-safe-offset-6">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1">
            <MessageSquare className="h-6 w-6" />
            <span className="text-xs">Messages</span>
          </button>
          
          <button 
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center space-y-1"
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Calendrier</span>
          </button>
          
          <button 
            onClick={() => onNavigate('clients')}
            className="flex flex-col items-center space-y-1"
          >
            <Users className="h-6 w-6" />
            <span className="text-xs">Clients</span>
          </button>
          
          <button 
            onClick={() => onNavigate('settings')}
            className="flex flex-col items-center space-y-1"
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs">Réglages</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
