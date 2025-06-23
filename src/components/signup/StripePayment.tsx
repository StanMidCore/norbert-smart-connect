
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, ArrowLeft, Check, Smartphone } from 'lucide-react';
import StripeElements from './StripeElements';
import PaymentForm from './PaymentForm';

interface StripePaymentProps {
  signupId: string;
  email: string;
  onComplete: () => void;
  onBack: () => void;
}

const StripePayment = ({ signupId, email, onComplete, onBack }: StripePaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'form' | 'checkout' | 'choice'>('choice');

  if (paymentMethod === 'form') {
    return (
      <PaymentForm 
        signupId={signupId}
        email={email}
        onComplete={onComplete}
        onBack={() => setPaymentMethod('choice')}
      />
    );
  }

  if (paymentMethod === 'checkout') {
    return (
      <StripeElements 
        signupId={signupId}
        email={email}
        onComplete={onComplete}
        onBack={() => setPaymentMethod('choice')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Choisissez votre méthode de paiement</CardTitle>
          <CardDescription>
            Comment souhaitez-vous procéder au paiement ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => setPaymentMethod('form')} 
            className="w-full h-16 flex items-center justify-center space-x-3"
            variant="outline"
          >
            <CreditCard className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Saisie directe</div>
              <div className="text-sm text-gray-600">Entrez vos coordonnées bancaires</div>
            </div>
          </Button>

          <Button 
            onClick={() => setPaymentMethod('checkout')} 
            className="w-full h-16 flex items-center justify-center space-x-3"
            variant="outline"
          >
            <Smartphone className="w-6 h-6" />
            <div className="text-left">
              <div className="font-semibold">Stripe Checkout</div>
              <div className="text-sm text-gray-600">Page web sécurisée</div>
            </div>
          </Button>

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
            <p>• 197€/mois après l'essai</p>
          </div>

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
