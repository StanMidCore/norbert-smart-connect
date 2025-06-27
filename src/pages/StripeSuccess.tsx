
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StripeSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Cette page ne devrait jamais être vue car stripe-success redirige automatiquement
    // Mais au cas où, rediriger vers l'accueil
    const timer = setTimeout(() => {
      navigate('/?payment_success=true');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Traitement en cours...</h1>
        <p className="text-gray-600">Votre paiement est en cours de validation.</p>
      </div>
    </div>
  );
};

export default StripeSuccess;
