
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

    // Enhanced logging with more context
    const logData = {
      function_name: entry.function_name,
      event: entry.event,
      details: {
        ...entry.details,
        timestamp: new Date().toISOString(),
        environment: 'production',
        // Add request context if available
        user_agent: entry.details?.user_agent || 'unknown',
        ip_address: entry.details?.ip_address || 'unknown'
      },
      user_id: entry.user_id,
      user_email: entry.user_email,
      level: entry.level || 'info',
      created_at: new Date().toISOString()
    };

    await supabase.from('edge_function_logs').insert(logData);

    // Also log to console for immediate debugging
    const logLevel = entry.level || 'info';
    const message = `[${entry.function_name}] ${entry.event}`;
    
    switch (logLevel) {
      case 'error':
        console.error(message, entry.details);
        break;
      case 'warn':
        console.warn(message, entry.details);
        break;
      case 'debug':
        console.debug(message, entry.details);
        break;
      default:
        console.info(message, entry.details);
    }
  } catch (error) {
    console.error('Failed to log event:', error);
  }
};

// Helper functions for common log patterns
export const logError = (functionName: string, event: string, error: any, userId?: string, userEmail?: string) => {
  logEvent({
    function_name: functionName,
    event: `ERROR: ${event}`,
    details: {
      error: error.message || error,
      stack: error.stack,
      type: error.constructor?.name
    },
    user_id: userId,
    user_email: userEmail,
    level: 'error'
  });
};

export const logDebug = (functionName: string, event: string, details?: any, userId?: string, userEmail?: string) => {
  logEvent({
    function_name: functionName,
    event: `DEBUG: ${event}`,
    details,
    user_id: userId,
    user_email: userEmail,
    level: 'debug'
  });
};

export const logPerformance = (functionName: string, operation: string, duration: number, userId?: string) => {
  logEvent({
    function_name: functionName,
    event: `PERFORMANCE: ${operation}`,
    details: {
      duration_ms: duration,
      performance_category: duration > 5000 ? 'slow' : duration > 1000 ? 'medium' : 'fast'
    },
    user_id: userId,
    level: duration > 5000 ? 'warn' : 'info'
  });
};
