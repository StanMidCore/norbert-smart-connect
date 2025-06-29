
-- Créer une table pour les logs des edge functions
CREATE TABLE public.edge_function_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  event TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  user_id UUID,
  user_email TEXT,
  level TEXT DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_edge_function_logs_created_at ON public.edge_function_logs(created_at DESC);
CREATE INDEX idx_edge_function_logs_function_name ON public.edge_function_logs(function_name);
CREATE INDEX idx_edge_function_logs_level ON public.edge_function_logs(level);
CREATE INDEX idx_edge_function_logs_user_email ON public.edge_function_logs(user_email);

-- Activer RLS (optionnel, pour sécuriser les logs si nécessaire)
ALTER TABLE public.edge_function_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux edge functions d'insérer des logs
CREATE POLICY "Edge functions can insert logs" 
  ON public.edge_function_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Politique pour permettre la lecture des logs (pour le debugging)
CREATE POLICY "Allow read access to logs" 
  ON public.edge_function_logs 
  FOR SELECT 
  USING (true);
