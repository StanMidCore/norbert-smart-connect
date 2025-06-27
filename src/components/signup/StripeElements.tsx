
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, Check, Lock } from 'lucide-react';

interface StripeElementsProps {
  signupId: string;
  email: string;
  onComplete: () => void;
  onBack: () => void;
}

const StripeElements = ({ signupId, email, onComplete, onBack }: StripeElementsProps) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      console.log('🔄 Création session Stripe Checkout pour:', email);
      
      const { data, error } = await supabase.functions.invoke('process-stripe-payment', {
        body: {
          signup_id: signupId,
          email: email
        }
      });

      console.log('📊 Réponse process-stripe-payment:', data, error);

      if (error) {
        console.error('❌ Erreur de la fonction:', error);
        throw error;
      }

      if (data?.success && data?.checkout_url) {
        console.log('🔗 Redirection vers Stripe Checkout:', data.checkout_url);
        
        // Rediriger vers Stripe Checkout dans la même fenêtre
        window.location.href = data.checkout_url;
        
        toast.success('Redirection vers Stripe Checkout...');
      } else {
        throw new Error(data?.error || 'Erreur lors de la création de la session de paiement');
      }
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur de paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Commencez votre essai</CardTitle>
          <CardDescription>
            15 jours gratuits, puis 197€/mois
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Ce qui est inclus :</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Assistant personnel qui réponds à vos emails
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Fixe et modifie vos rendez-vous
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Publie sur vos réseaux sociaux
              </li>
              <li className="flex items-center">
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Réponds aux demandes venant de vos réseaux sociaux
              </li>
            </ul>
          </div>

          <div className="flex items-center text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
            <Lock className="w-4 h-4 mr-2" />
            <span>Paiement sécurisé par Stripe - Vos données sont protégées</span>
          </div>

          <Button 
            onClick={handlePayment} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Redirection vers Stripe...' : 'Commencer l\'essai gratuit'}
          </Button>

          <Button variant="ghost" onClick={onBack} className="w-full">
            Retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeElements;
