import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Check, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentFormProps {
  signupId: string;
  email: string;
  onComplete: () => void;
  onBack: () => void;
}

const PaymentForm = ({ signupId, email, onComplete, onBack }: PaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvc: '',
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

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardData({ ...cardData, cardNumber: formatted });
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setCardData({ ...cardData, expiryDate: formatted });
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/gi, '');
    if (value.length <= 4) {
      setCardData({ ...cardData, cvc: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation basique
      if (!cardData.cardName || !cardData.cardNumber || !cardData.expiryDate || !cardData.cvc) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (cardData.cardNumber.replace(/\s/g, '').length < 13) {
        throw new Error('Numéro de carte invalide');
      }

      if (cardData.expiryDate.length !== 5) {
        throw new Error('Date d\'expiration invalide');
      }

      if (cardData.cvc.length < 3) {
        throw new Error('CVC invalide');
      }

      console.log('Traitement du paiement avec les données de carte...');

      // Simuler le traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Marquer le paiement comme complété et déclencher la création des comptes
      const { error: updateError } = await supabase
        .from('signup_process')
        .update({
          payment_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', signupId);

      if (updateError) {
        throw updateError;
      }

      // Appeler la fonction pour créer les comptes automatiquement
      console.log('Création des comptes automatiques...');
      const { data: accountData, error: accountError } = await supabase.functions.invoke('create-user-account', {
        body: { 
          email: email,
          signup_id: signupId 
        }
      });

      if (accountError) {
        console.error('Erreur création compte:', accountError);
        // Ne pas faire échouer le processus si les comptes ne peuvent pas être créés
        toast.error('Paiement réussi mais erreur lors de la création des comptes. Contactez le support.');
      } else {
        console.log('Comptes créés avec succès:', accountData);
      }

      toast.success('Paiement effectué avec succès !');
      
      // Rediriger vers la configuration des canaux
      setTimeout(() => {
        onComplete();
      }, 1000);

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
          <CardTitle className="text-2xl font-bold">Informations de paiement</CardTitle>
          <CardDescription>
            Saisissez vos coordonnées bancaires pour commencer votre essai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardName">Nom sur la carte</Label>
              <Input
                id="cardName"
                type="text"
                placeholder="John Doe"
                value={cardData.cardName}
                onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Numéro de carte</Label>
              <Input
                id="cardNumber"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardData.cardNumber}
                onChange={handleCardNumberChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Date d'expiration</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  placeholder="MM/YY"
                  value={cardData.expiryDate}
                  onChange={handleExpiryDateChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  type="text"
                  placeholder="123"
                  value={cardData.cvc}
                  onChange={handleCvcChange}
                  required
                />
              </div>
            </div>

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
              <span>Paiement sécurisé - Vos données sont protégées</span>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>• Essai gratuit de 15 jours</p>
              <p>• Annulation possible à tout moment</p>
              <p>• 197€/mois après l'essai</p>
            </div>

            <Button 
              type="submit"
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Traitement en cours...' : 'Commencer l\'essai gratuit'}
            </Button>
          </form>

          <Button variant="ghost" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentForm;
