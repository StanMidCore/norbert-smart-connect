
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const StripeSuccessHandler = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleStripeSuccess = async () => {
      console.log('🎯 StripeSuccessHandler: Début du traitement');
      
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const signupId = urlParams.get('signup_id');

        console.log('📊 Paramètres reçus:', { sessionId, signupId });

        if (!sessionId || !signupId) {
          throw new Error('Paramètres manquants');
        }

        console.log('🔄 Traitement du paiement...');
        
        const { data, error } = await supabase.functions.invoke('stripe-success', {
          body: {
            session_id: sessionId,
            signup_id: signupId
          }
        });

        console.log('📊 Réponse stripe-success:', data, error);

        if (error) {
          console.error('❌ Erreur stripe-success:', error);
          throw error;
        }

        console.log('✅ Compte créé avec succès pour:', data?.user_email);
        
        setStatus('success');
        
        // Rediriger vers les canaux après un petit délai
        setTimeout(() => {
          navigate('/?payment_success=true');
        }, 2000);

      } catch (error) {
        console.error('❌ Erreur dans StripeSuccessHandler:', error);
        setStatus('error');
        
        // Rediriger vers l'erreur après 3 secondes
        setTimeout(() => {
          navigate('/?payment_error=true');
        }, 3000);
      }
    };

    handleStripeSuccess();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold mb-4">Création de votre compte...</h1>
            <p className="text-gray-600 mb-4">Configuration en cours, veuillez patienter.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-4">Compte créé avec succès !</h1>
            <p className="text-gray-600 mb-4">Votre compte a été configuré.</p>
            <p className="text-sm text-gray-500 mb-4">Redirection vers la configuration des canaux...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-600 text-6xl mb-4">✗</div>
            <h1 className="text-2xl font-bold mb-4">Erreur de traitement</h1>
            <p className="text-gray-600 mb-4">Une erreur s'est produite lors du traitement.</p>
            <p className="text-sm text-gray-500 mb-4">Redirection vers la page d'accueil...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default StripeSuccessHandler;
