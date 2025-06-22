
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreditCard, ArrowLeft, Check } from 'lucide-react';

interface StripePaymentProps {
  signupId: string;
  email: string;
  onComplete: () => void;
  onBack: () => void;
}

const StripePayment = ({ signupId, email, onComplete, onBack }: StripePaymentProps) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          signup_id: signupId,
          email: email
        }
      });

      if (error) throw error;

      if (data.success && data.checkout_url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur de paiement');
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

          <div className="text-center text-sm text-gray-600">
            <p>• Essai gratuit de 15 jours</p>
            <p>• Annulation possible à tout moment</p>
            <p>• Paiement sécurisé par Stripe</p>
          </div>

          <Button onClick={handlePayment} className="w-full" disabled={loading}>
            {loading ? 'Redirection...' : 'Commencer l\'essai gratuit'}
          </Button>

          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripePayment;
