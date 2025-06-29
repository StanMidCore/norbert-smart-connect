
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const StripeSuccessHandler = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const handleStripeSuccess = async () => {
      console.log('🎯 StripeSuccessHandler: Début du traitement');
      
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const signupId = urlParams.get('signup_id');

        console.log('📊 Paramètres reçus:', { sessionId, signupId });
        setDebugInfo({ sessionId, signupId, step: 'params_received' });

        if (!sessionId || !signupId) {
          throw new Error('Paramètres manquants');
        }

        // Appeler directement la fonction stripe-success
        console.log('🔄 Appel de la fonction stripe-success...');
        setDebugInfo(prev => ({ ...prev, step: 'calling_stripe_success' }));
        
        const { data, error } = await supabase.functions.invoke('stripe-success', {
          body: {
            session_id: sessionId,
            signup_id: signupId
          }
        });

        console.log('📊 Réponse stripe-success:', data, error);
        setDebugInfo(prev => ({ ...prev, stripe_response: data, stripe_error: error }));

        if (error) {
          console.error('❌ Erreur stripe-success:', error);
          throw error;
        }

        console.log('✅ Stripe-success terminé avec succès');
        setStatus('success');
        
        // Si nous avons reçu les informations utilisateur, utiliser le bon nettoyage
        if (data && data.user_email && data.user_id) {
          console.log(`🧹 Déclenchement nettoyage pour le BON utilisateur: ${data.user_email}`);
          try {
            const { data: cleanupData, error: cleanupError } = await supabase.functions.invoke('cleanup-channels', {
              body: {
                user_id: data.user_id,
                user_email: data.user_email
              }
            });
            console.log('🧹 Résultat nettoyage:', cleanupData, cleanupError);
            setDebugInfo(prev => ({ ...prev, cleanup_response: cleanupData, cleanup_error: cleanupError }));
          } catch (cleanupErr) {
            console.error('❌ Erreur nettoyage:', cleanupErr);
          }
        }
        
        // Rediriger vers les canaux
        navigate('/?payment_success=true');

      } catch (error) {
        console.error('❌ Erreur dans StripeSuccessHandler:', error);
        setStatus('error');
        setDebugInfo(prev => ({ ...prev, error: error.message }));
        
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
            <h1 className="text-2xl font-bold mb-4">Traitement du paiement...</h1>
            <p className="text-gray-600 mb-4">Création de votre compte et nettoyage des canaux en cours...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-4">Paiement réussi !</h1>
            <p className="text-gray-600 mb-4">Redirection vers la configuration des canaux...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-600 text-6xl mb-4">✗</div>
            <h1 className="text-2xl font-bold mb-4">Erreur de traitement</h1>
            <p className="text-gray-600 mb-4">Redirection vers la page d'accueil...</p>
          </>
        )}

        {/* Debug info */}
        <details className="mt-6 text-left bg-gray-100 p-4 rounded">
          <summary className="cursor-pointer font-semibold">Debug Info</summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default StripeSuccessHandler;
