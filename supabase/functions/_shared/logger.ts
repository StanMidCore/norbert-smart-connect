
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export interface LogEntry {
  function_name: string;
  event: string;
  details?: any;
  user_id?: string;
  user_email?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

export const logEvent = async (entry: LogEntry) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('edge_function_logs').insert({
      function_name: entry.function_name,
      event: entry.event,
      details: entry.details || {},
      user_id: entry.user_id,
      user_email: entry.user_email,
      level: entry.level || 'info',
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log event:', error);
  }
};
