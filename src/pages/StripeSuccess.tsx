
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StripeSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Rediriger vers l'accueil avec le paramètre de succès
    const timer = setTimeout(() => {
      navigate('/?payment_success=true');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold mb-4">Paiement confirmé</h1>
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
};

export default StripeSuccess;
