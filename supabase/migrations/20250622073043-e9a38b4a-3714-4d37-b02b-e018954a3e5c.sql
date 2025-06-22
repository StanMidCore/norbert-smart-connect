
-- Créer une table pour les utilisateurs de Norbert
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  workflow_id_n8n TEXT,
  autopilot BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Créer une table pour les canaux de communication
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'whatsapp', 'sms', 'instagram', 'facebook')),
  unipile_account_id TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  priority_order INTEGER DEFAULT 1,
  connected_at TIMESTAMP WITH TIME ZONE,
  provider_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer une table pour les clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  first_contact TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_contact TIMESTAMP WITH TIME ZONE DEFAULT now(),
  total_messages INTEGER DEFAULT 0,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'active', 'converted', 'lost')),
  preferred_channel TEXT CHECK (preferred_channel IN ('email', 'whatsapp', 'sms', 'instagram', 'facebook')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer une table pour les conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'whatsapp', 'sms', 'instagram', 'facebook')),
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  messages_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer une table pour les messages de conversation
CREATE TABLE public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'user', 'ai')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'whatsapp', 'sms', 'instagram', 'facebook')),
  read BOOLEAN DEFAULT false
);

-- Créer une table pour les messages entrants
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  from_number TEXT,
  body_preview TEXT NOT NULL,
  urgent BOOLEAN DEFAULT false,
  requires_response BOOLEAN DEFAULT true,
  handled_by TEXT DEFAULT 'IA' CHECK (handled_by IN ('IA', 'user')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response_status TEXT DEFAULT 'pending' CHECK (response_status IN ('pending', 'responded', 'ignored'))
);

-- Créer une table pour les profils clients (configuration IA)
CREATE TABLE public.client_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bio_description TEXT,
  website_url TEXT,
  services_offered TEXT,
  availability TEXT,
  pricing TEXT,
  ai_instructions_built TEXT,
  n8n_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Créer une table pour les rendez-vous
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  created_by TEXT DEFAULT 'IA' CHECK (created_by IN ('IA', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activer Row Level Security sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS basiques (pour l'instant, tout public pour le développement)
CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations on channels" ON public.channels FOR ALL USING (true);
CREATE POLICY "Allow all operations on clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow all operations on conversations" ON public.conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations on conversation_messages" ON public.conversation_messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on client_profiles" ON public.client_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on appointments" ON public.appointments FOR ALL USING (true);

-- Insérer un utilisateur de démonstration
INSERT INTO public.users (email, phone_number, autopilot) 
VALUES ('demo@norbert.ai', '+33123456789', true);
