
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardData({ ...cardData, number: formatted });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    if (formatted.length <= 5) {
      setCardData({ ...cardData, expiry: formatted });
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 4) {
      setCardData({ ...cardData, cvc: value });
    }
  };

  const validateCard = () => {
    const cleanNumber = cardData.number.replace(/\s/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      toast.error('Numéro de carte invalide');
      return false;
    }
    if (!cardData.expiry.match(/^\d{2}\/\d{2}$/)) {
      toast.error('Date d\'expiration invalide (MM/AA)');
      return false;
    }
    if (cardData.cvc.length < 3) {
      toast.error('Code CVC invalide');
      return false;
    }
    if (!cardData.name.trim()) {
      toast.error('Nom du titulaire requis');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateCard()) return;

    setLoading(true);
    try {
      console.log('Traitement du paiement avec Stripe Elements pour:', email);
      
      const { data, error } = await supabase.functions.invoke('process-stripe-payment', {
        body: {
          signup_id: signupId,
          email: email,
          card: {
            number: cardData.number.replace(/\s/g, ''),
            exp_month: parseInt(cardData.expiry.split('/')[0]),
            exp_year: parseInt('20' + cardData.expiry.split('/')[1]),
            cvc: cardData.cvc
          },
          billing_details: {
            name: cardData.name,
            email: email
          }
        }
      });

      console.log('Réponse de process-stripe-payment:', data, error);

      if (error) {
        console.error('Erreur de la fonction:', error);
        throw error;
      }

      if (data.success) {
        toast.success('Paiement traité avec succès !');
        onComplete();
      } else {
        throw new Error(data.error || 'Erreur lors du traitement du paiement');
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardName">Nom du titulaire</Label>
              <Input
                id="cardName"
                type="text"
                value={cardData.name}
                onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                placeholder="Jean Dupont"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Numéro de carte</Label>
              <Input
                id="cardNumber"
                type="text"
                value={cardData.number}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">MM/AA</Label>
                <Input
                  id="expiry"
                  type="text"
                  value={cardData.expiry}
                  onChange={handleExpiryChange}
                  placeholder="12/25"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  type="text"
                  value={cardData.cvc}
                  onChange={handleCvcChange}
                  placeholder="123"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
            <Lock className="w-4 h-4 mr-2" />
            <span>Paiement sécurisé par Stripe - Vos données sont protégées</span>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>• Essai gratuit de 15 jours</p>
            <p>• Annulation possible à tout moment</p>
            <p>• Aucun engagement</p>
          </div>

          <Button 
            onClick={handlePayment} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? 'Traitement...' : 'Commencer l\'essai gratuit'}
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
