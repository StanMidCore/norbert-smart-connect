
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const providerMapping: { [key: string]: string } = {
  'gmail': 'GOOGLE',
  'outlook': 'OUTLOOK', 
  'facebook': 'MESSENGER',
  'instagram': 'INSTAGRAM'
};
