
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// === DIAGNOSTIC COMPLET AU STARTUP ===
console.log('🚀 === FONCTION CREATE-N8N-WORKFLOW DÉPLOYÉE ===');
console.log('⏰ Timestamp démarrage:', new Date().toISOString());
console.log('🌍 Deno version:', Deno.version.deno);

// Test des variables d'environnement
const N8N_BASE_URL = Deno.env.get('N8N_BASE_URL');
const N8N_API_KEY = Deno.env.get('N8N_API_KEY');
const NORBERT_FOLDER_ID = Deno.env.get('NORBERT_FOLDER_ID');

console.log('🔑 === VARIABLES D\'ENVIRONNEMENT ===');
console.log('N8N_BASE_URL:', N8N_BASE_URL ? 'PRÉSENT' : 'MANQUANT');
console.log('N8N_API_KEY:', N8N_API_KEY ? 'PRÉSENT' : 'MANQUANT');
console.log('NORBERT_FOLDER_ID:', NORBERT_FOLDER_ID ? 'PRÉSENT' : 'MANQUANT');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Constantes de fallback
const N8N_API_KEY_CONST = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2E5NWQ2NS1kZTI5LTRlN2EtYjQxZC0yYjhjZTdiYTQwYzgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUxMDExNzgxfQ.k4c-dAmKJpK5aUk2idyW1HFNmayS3xba4PrbUGa88CY';
const N8N_BASE_URL_CONST = 'https://n8n.srv784558.hstgr.cloud';
const NORBERT_FOLDER_ID_CONST = 'uO7pivHjhurjrT2k';

serve(async (req) => {
  console.log('🎯 === REQUÊTE REÇUE ===');
  console.log(`📨 Méthode: ${req.method}`);
  console.log(`🔗 URL: ${req.url}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

  // Test de connectivité réseau basique
  try {
    console.log('🌐 Test de connectivité réseau...');
    const testResponse = await fetch('https://httpbin.org/status/200', {
      method: 'GET'
    });
    console.log('✅ Connectivité réseau OK:', testResponse.status);
  } catch (networkError) {
    console.error('❌ Erreur connectivité réseau:', networkError.message);
  }

  // Test de connectivité N8N
  try {
    console.log('🏥 Test de connectivité N8N...');
    const finalN8nUrl = N8N_BASE_URL || N8N_BASE_URL_CONST;
    const finalN8nKey = N8N_API_KEY || N8N_API_KEY_CONST;
    
    console.log('🔗 URL N8N utilisée:', finalN8nUrl);
    console.log('🔑 Clé N8N présente:', finalN8nKey ? 'OUI' : 'NON');
    
    const testResponse = await fetch(`${finalN8nUrl}/rest/health`, {
      headers: { 'Authorization': `Bearer ${finalN8nKey}` }
    });
    console.log('🏥 Test santé N8N:', testResponse.status, testResponse.statusText);
    
    if (testResponse.ok) {
      console.log('✅ N8N accessible et authentifié');
    } else {
      console.error('❌ N8N non accessible ou authentification échouée');
    }
  } catch (testError) {
    console.error('❌ Erreur critique N8N:', testError.message);
  }
  
  if (req.method === 'OPTIONS') {
    console.log('⚡ Réponse OPTIONS CORS');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📋 Lecture du body de la requête...');
    const body = await req.json();
    console.log('📊 Body reçu:', JSON.stringify(body, null, 2));
    
    const { userEmail, userName } = body;
    console.log(`🚀 CRÉATION WORKFLOW N8N - Email: ${userEmail}, Nom: ${userName}`);

    if (!userEmail || !userName) {
      console.error('❌ Paramètres manquants:', { userEmail, userName });
      throw new Error('Email et nom utilisateur requis');
    }

    // Test de base - retourner succès pour vérifier que la fonction fonctionne
    console.log('✅ FONCTION OPÉRATIONNELLE - Test de base réussi');
    
    const testResponse = {
      success: true,
      message: 'Fonction create-n8n-workflow déployée et opérationnelle',
      timestamp: new Date().toISOString(),
      user_email: userEmail,
      user_name: userName,
      test_mode: true
    };

    console.log('📤 Réponse de test:', JSON.stringify(testResponse, null, 2));

    return new Response(JSON.stringify(testResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ ERREUR DANS LA FONCTION:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Message:', error.message);
    
    const errorResponse = {
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      function_status: 'deployed_but_error'
    };
    
    console.log('📤 Réponse d\'erreur:', JSON.stringify(errorResponse, null, 2));
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
