
import { ProcessingResult, ErrorResult } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function createSuccessResponse(
  method: string,
  origin: string | null,
  result: ProcessingResult
): Response {
  // Pour les appels POST (depuis le frontend), retourner une réponse JSON COMPLÈTE
  if (method === 'POST') {
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Pour les appels GET (redirection Stripe), rediriger
  const redirectUrl = `${origin || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_success=true&email=${encodeURIComponent(result.user_email)}`;
  
  console.log('🔄 Redirection vers:', redirectUrl);
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl,
      ...corsHeaders
    },
  });
}

export function createErrorResponse(
  method: string,
  origin: string | null,
  error: ErrorResult
): Response {
  // Pour les appels POST, retourner une erreur JSON
  if (method === 'POST') {
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Pour les appels GET, rediriger vers une page d'erreur
  const errorUrl = `${origin || 'https://dmcgxjmkvqfyvsfsiexe.supabase.co'}/?payment_error=true`;
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': errorUrl,
      ...corsHeaders
    },
  });
}
