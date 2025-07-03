
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type LogEntry = Tables<'edge_function_logs'>;

// Anonymization utilities
export const anonymizeEmail = (email: string | null): string => {
  if (!email) return 'anonymous';
  const domain = email.split('@')[1] || 'unknown.com';
  const hash = email.split('@')[0].slice(0, 3);
  return `user_${hash}***@${domain}`;
};

export const anonymizeData = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key', 'access_token', 'refresh_token'];
  const result: any = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
    
    if (isSensitive && typeof value === 'string') {
      result[key] = `[MASKED_${value.length}_CHARS]`;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = anonymizeData(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

// Export functions
export const exportLogsForClaude = async (hours: number = 24): Promise<string> => {
  try {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    
    const { data: logs, error } = await supabase
      .from('edge_function_logs')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const anonymizedLogs = logs?.map(log => ({
      id: log.id,
      function_name: log.function_name,
      event: log.event,
      level: log.level,
      created_at: log.created_at,
      user_email: anonymizeEmail(log.user_email),
      details: anonymizeData(log.details)
    })) || [];

    const exportData = {
      export_timestamp: new Date().toISOString(),
      period_hours: hours,
      total_logs: anonymizedLogs.length,
      logs: anonymizedLogs,
      summary: generateLogsSummary(anonymizedLogs)
    };

    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting logs:', error);
    throw new Error('Failed to export logs');
  }
};

export const generateLogsSummary = (logs: any[]): any => {
  const summary = {
    error_count: logs.filter(l => l.level === 'error').length,
    warn_count: logs.filter(l => l.level === 'warn').length,
    info_count: logs.filter(l => l.level === 'info').length,
    functions_activity: {} as Record<string, number>,
    recent_errors: [] as any[],
    timeline: [] as any[]
  };

  // Count activity per function
  logs.forEach(log => {
    summary.functions_activity[log.function_name] = (summary.functions_activity[log.function_name] || 0) + 1;
  });

  // Get recent errors
  summary.recent_errors = logs
    .filter(l => l.level === 'error')
    .slice(0, 10)
    .map(l => ({
      function: l.function_name,
      event: l.event,
      time: l.created_at,
      details: l.details
    }));

  // Create timeline (last 6 hours, hourly buckets)
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - i);
    hour.setMinutes(0, 0, 0);
    
    const nextHour = new Date(hour);
    nextHour.setHours(nextHour.getHours() + 1);
    
    const hourLogs = logs.filter(l => {
      const logTime = new Date(l.created_at);
      return logTime >= hour && logTime < nextHour;
    });
    
    summary.timeline.push({
      hour: hour.toISOString(),
      total: hourLogs.length,
      errors: hourLogs.filter(l => l.level === 'error').length,
      functions: [...new Set(hourLogs.map(l => l.function_name))]
    });
  }

  return summary;
};

export const generateContextReport = async (): Promise<string> => {
  try {
    const context = {
      app_info: {
        name: "Norbert AI Assistant",
        version: "1.0.0",
        environment: "production"
      },
      database_structure: {
        main_tables: [
          "users", "channels", "messages", "appointments", 
          "clients", "edge_function_logs", "signup_process"
        ],
        edge_functions: [
          "stripe-success", "connect-unipile-account", "cleanup-channels",
          "create-n8n-workflow", "unipile-accounts", "activate-account"
        ]
      },
      recent_activity: await getRecentActivity(),
      system_health: await getSystemHealth()
    };

    return `# Norbert AI - Context Report
Generated: ${new Date().toISOString()}

## Application Overview
- **Name**: ${context.app_info.name}
- **Version**: ${context.app_info.version}
- **Environment**: ${context.app_info.environment}

## Database Structure
**Main Tables**: ${context.database_structure.main_tables.join(', ')}
**Edge Functions**: ${context.database_structure.edge_functions.join(', ')}

## Recent Activity
${JSON.stringify(context.recent_activity, null, 2)}

## System Health
${JSON.stringify(context.system_health, null, 2)}

---
*This report was generated automatically for debugging purposes.*
`;
  } catch (error) {
    console.error('Error generating context report:', error);
    return `# Context Report - Error\nFailed to generate context report: ${error}`;
  }
};

const getRecentActivity = async () => {
  try {
    const { data: recentLogs } = await supabase
      .from('edge_function_logs')
      .select('function_name, level, created_at')
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      last_2_hours_activity: recentLogs?.length || 0,
      active_functions: [...new Set(recentLogs?.map(l => l.function_name) || [])],
      error_rate: recentLogs ? recentLogs.filter(l => l.level === 'error').length / recentLogs.length : 0
    };
  } catch (error) {
    return { error: 'Failed to fetch recent activity' };
  }
};

const getSystemHealth = async () => {
  try {
    const { data: channels } = await supabase
      .from('channels')
      .select('channel_type, status')
      .limit(100);

    const { data: users } = await supabase
      .from('users')
      .select('id, created_at')
      .limit(100);

    return {
      total_channels: channels?.length || 0,
      connected_channels: channels?.filter(c => c.status === 'connected').length || 0,
      total_users: users?.length || 0,
      channels_by_type: channels?.reduce((acc, c) => {
        acc[c.channel_type] = (acc[c.channel_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };
  } catch (error) {
    return { error: 'Failed to fetch system health' };
  }
};

export const generateDebugTemplate = (problemDescription: string, logs: any[]): string => {
  const recentErrors = logs.filter(l => l.level === 'error').slice(0, 5);
  const relevantFunctions = [...new Set(logs.map(l => l.function_name))];

  return `# Debug Request for Claude

## Problem Description
${problemDescription}

## Environment
- **App**: Norbert AI Assistant
- **Frontend**: React/TypeScript with Supabase
- **Backend**: Supabase Edge Functions
- **Timestamp**: ${new Date().toISOString()}

## Recent Errors (Last 5)
${recentErrors.map(error => `
### ${error.function_name} - ${error.event}
- **Time**: ${error.created_at}
- **Level**: ${error.level}
- **Details**: ${JSON.stringify(error.details, null, 2)}
`).join('\n')}

## Active Functions
${relevantFunctions.join(', ')}

## Request
Please help me debug this issue. I've included the relevant logs above with sensitive data anonymized.

---
*Generated automatically by Norbert Debug System*
`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
