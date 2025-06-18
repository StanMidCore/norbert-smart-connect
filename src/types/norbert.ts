
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

export interface ClientProfile {
  user_id: string;
  bio_description: string;
  website_url?: string;
  services_offered: string;
  availability: string;
  pricing: string;
  ai_instructions_built: string;
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
