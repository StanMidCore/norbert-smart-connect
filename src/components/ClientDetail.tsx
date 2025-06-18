import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MessageSquare, 
  Send,
  MoreVertical,
  Star,
  Calendar,
  User,
  CheckCircle,
  X,
  Edit,
  Bot
} from 'lucide-react';
import type { Client, ConversationMessage, Conversation } from '@/types/norbert';

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
}

interface PendingResponse {
  id: string;
  content: string;
  generatedAt: string;
  conversationId: string;
}

const ClientDetail = ({ clientId, onBack }: ClientDetailProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [pendingResponse, setPendingResponse] = useState<PendingResponse | null>(null);
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [editedResponse, setEditedResponse] = useState('');

  // Données de démo - dans un vrai projet, ces données viendraient de Supabase
  const client: Client = {
    id: clientId,
    name: 'Marie Dubois',
    phone_number: '+33123456789',
    email: 'marie.dubois@email.com',
    first_contact: '2024-01-15',
    last_contact: new Date().toISOString(),
    total_messages: 12,
    status: 'active',
    preferred_channel: 'whatsapp',
    notes: 'Intéressée par une rénovation complète de sa salle de bain. Budget estimé : 8000€'
  };

  const conversations: Conversation[] = [
    {
      id: 'conv1',
      client_id: clientId,
      channel_type: 'whatsapp',
      subject: 'Devis salle de bain',
      last_message_at: new Date().toISOString(),
      messages_count: 8,
      unread_count: 1
    },
    {
      id: 'conv2',
      client_id: clientId,
      channel_type: 'email',
      subject: 'Disponibilités intervention',
      last_message_at: new Date(Date.now() - 86400000).toISOString(),
      messages_count: 4,
      unread_count: 0
    }
  ];

  const messages: ConversationMessage[] = [
    {
      id: 'msg1',
      conversation_id: 'conv1',
      sender: 'client',
      content: 'Bonjour, je souhaiterais un devis pour une rénovation de salle de bain. Pouvez-vous me rappeler ?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      channel_type: 'whatsapp',
      read: true
    },
    {
      id: 'msg2',
      conversation_id: 'conv1',
      sender: 'ai',
      content: 'Bonjour Marie ! Je serais ravi de vous aider pour votre projet de rénovation. Pouvez-vous me donner plus de détails sur vos attentes ?',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
      channel_type: 'whatsapp',
      read: true
    },
    {
      id: 'msg3',
      conversation_id: 'conv1',
      sender: 'client',
      content: 'Je voudrais refaire entièrement ma salle de bain de 6m². Douche italienne, carrelage moderne, meuble vasque...',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      channel_type: 'whatsapp',
      read: true
    },
    {
      id: 'msg4',
      conversation_id: 'conv1',
      sender: 'client',
      content: 'Quels sont vos tarifs et vos disponibilités ?',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      channel_type: 'whatsapp',
      read: false
    }
  ];

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'sms': return <Phone className="h-4 w-4 text-purple-600" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channelType: string) => {
    switch (channelType) {
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-blue-100 text-blue-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  };

  const simulatePendingResponse = () => {
    const mockResponse: PendingResponse = {
      id: 'pending_' + Date.now(),
      content: 'Bonjour Marie ! Merci pour votre demande de devis. Pour une salle de bain de 6m² avec douche italienne et carrelage moderne, nous proposons un forfait entre 6000€ et 8500€ selon les finitions choisies. Je peux passer chez vous cette semaine pour un devis précis. Quelles sont vos disponibilités ?',
      generatedAt: new Date().toISOString(),
      conversationId: activeConversation
    };
    setPendingResponse(mockResponse);
    setEditedResponse(mockResponse.content);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // En mode manuel, on simule la génération d'une réponse IA
      console.log('Génération de la réponse IA pour:', newMessage);
      setNewMessage('');
      
      // Simuler un délai de génération
      setTimeout(() => {
        simulatePendingResponse();
      }, 1000);
    }
  };

  const handleApproveResponse = () => {
    if (pendingResponse) {
      console.log('Envoi de la réponse approuvée:', isEditingResponse ? editedResponse : pendingResponse.content);
      // Ici on enverrait la réponse via l'API N8N
      setPendingResponse(null);
      setIsEditingResponse(false);
      setEditedResponse('');
    }
  };

  const handleRejectResponse = () => {
    setPendingResponse(null);
    setIsEditingResponse(false);
    setEditedResponse('');
  };

  const handleEditResponse = () => {
    setIsEditingResponse(true);
  };

  const handleCancelEdit = () => {
    setIsEditingResponse(false);
    setEditedResponse(pendingResponse?.content || '');
  };

  const activeConversation = selectedConversation || conversations[0]?.id;
  const activeMessages = messages.filter(msg => msg.conversation_id === activeConversation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-500">
              Premier contact: {new Date(client.first_contact).toLocaleDateString()}
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Informations client */}
      <div className="p-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Informations client</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Téléphone</p>
                <p className="text-sm font-medium">{client.phone_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{client.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Canal préféré</p>
                <div className="flex items-center space-x-1">
                  {getChannelIcon(client.preferred_channel)}
                  <span className="text-sm capitalize">{client.preferred_channel}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Messages totaux</p>
                <p className="text-sm font-medium">{client.total_messages}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dernier contact</p>
                <p className="text-sm font-medium">{formatTime(client.last_contact)}</p>
              </div>
            </div>

            {client.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm bg-gray-50 p-2 rounded">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversations */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold mb-3">Conversations</h2>
        
        {/* Liste des conversations */}
        <div className="space-y-2 mb-4">
          {conversations.map((conv) => (
            <Card 
              key={conv.id} 
              className={`cursor-pointer transition-colors ${
                activeConversation === conv.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getChannelIcon(conv.channel_type)}
                    <div>
                      <p className="font-medium text-sm">{conv.subject}</p>
                      <p className="text-xs text-gray-500">
                        {conv.messages_count} messages
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{formatTime(conv.last_message_at)}</p>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Messages de la conversation active */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64 px-4">
              <div className="space-y-3">
                {activeMessages.map((message) => (
                  <div 
                    key={message.id}
                    className={`flex ${message.sender === 'client' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs p-3 rounded-lg ${
                      message.sender === 'client' 
                        ? 'bg-gray-100 text-gray-900' 
                        : message.sender === 'ai'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-green-100 text-green-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">{formatTime(message.timestamp)}</p>
                        <div className="flex items-center space-x-1">
                          {message.sender === 'ai' && (
                            <Badge variant="outline" className="text-xs">IA</Badge>
                          )}
                          {!message.read && message.sender === 'client' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Réponse en attente de validation */}
            {pendingResponse && (
              <div className="border-t bg-blue-50 p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Réponse suggérée par l'IA</span>
                  <Badge variant="outline" className="text-xs">En attente de validation</Badge>
                </div>
                
                {isEditingResponse ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editedResponse}
                      onChange={(e) => setEditedResponse(e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Modifiez la réponse..."
                    />
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleApproveResponse}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Valider les modifications
                      </Button>
                      <Button 
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-900">{pendingResponse.content}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleApproveResponse}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approuver & Envoyer
                      </Button>
                      <Button 
                        onClick={handleEditResponse}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        onClick={handleRejectResponse}
                        variant="destructive"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Zone de réponse normale */}
            {!pendingResponse && (
              <div className="border-t p-4">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Tapez votre message ou demandez à l'IA de générer une réponse..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[60px]"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Réponse via {getChannelIcon(activeMessages[0]?.channel_type)} 
                    <span className="ml-1 capitalize">
                      {activeMessages[0]?.channel_type}
                    </span>
                  </p>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    Planifier RDV
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDetail;
