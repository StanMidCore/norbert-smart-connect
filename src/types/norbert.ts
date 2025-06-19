export interface User {
  id: string;
  email: string;
  phone_number?: string;
  workflow_id_n8n?: string;
  autopilot: boolean;
  created_at: string;
  last_login?: string;
}

export interface Channel {
  id: string;
  user_id: string;
  channel_type: 'email' | 'whatsapp' | 'sms' | 'instagram' | 'facebook';
  unipile_account_id: string;
  status: 'connected' | 'disconnected' | 'error';
  priority_order: number;
  connected_at: string;
}

export interface Message {
  id: string;
  user_id: string;
  channel_id: string;
  from_name: string;
  from_number?: string;
  body_preview: string;
  urgent: boolean;
  requires_response: boolean;
  handled_by: 'IA' | 'user';
  timestamp: string;
  response_status: 'pending' | 'responded' | 'ignored';
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender: 'client' | 'user' | 'ai';
  content: string;
  timestamp: string;
  channel_type: 'email' | 'whatsapp' | 'sms' | 'instagram' | 'facebook';
  read: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone_number?: string;
  email?: string;
  first_contact: string;
  last_contact: string;
  total_messages: number;
  status: 'prospect' | 'active' | 'converted' | 'lost';
  preferred_channel: 'email' | 'whatsapp' | 'sms' | 'instagram' | 'facebook';
  notes?: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  channel_type: 'email' | 'whatsapp' | 'sms' | 'instagram' | 'facebook';
  subject?: string;
  last_message_at: string;
  messages_count: number;
  unread_count: number;
}

export interface ClientProfile {
  user_id: string;
  bio_description: string;
  website_url?: string;
  services_offered: string;
  availability: string;
  pricing: string;
  ai_instructions_built: string;
  n8n_webhook_url?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_name: string;
  channel_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_by: 'IA' | 'user';
}
