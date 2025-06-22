
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap, Key, Mail } from 'lucide-react';
import { useActivation } from '@/hooks/useActivation';
import { useToast } from '@/hooks/use-toast';

interface ActivationScreenProps {
  onActivationSuccess: () => void;
}

const ActivationScreen = ({ onActivationSuccess }: ActivationScreenProps) => {
  const [step, setStep] = useState<'request' | 'activate'>('request');
  const [email, setEmail] = useState('demo@norbert.ai');
  const [phoneNumber, setPhoneNumber] = useState('+33123456789');
  const [activationCode, setActivationCode] = useState('');
  const { loading, error, generateActivationCode, activateAccount } = useActivation();
  const { toast } = useToast();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir votre adresse email",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateActivationCode(email.trim(), phoneNumber?.trim());
      
      setStep('activate');
      toast({
        title: "Code envoyé !",
        description: "Vérifiez vos emails pour récupérer votre code d'activation",
      });
    } catch (err) {
      console.error('Erreur demande code:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le code. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activationCode.trim()) {
      toast({
        title: "Code requis",
        description: "Veuillez saisir votre code d'activation",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await activateAccount(email.trim(), activationCode.trim());
      
      toast({
        title: "Activation réussie !",
        description: `Bienvenue ${result.user.email} ! Norbert est maintenant actif.`,
      });
      
      setTimeout(() => {
        onActivationSuccess();
      }, 1000);
    } catch (err) {
      console.error('Erreur activation:', err);
      toast({
        title: "Code invalide",
        description: "Le code d'activation est incorrect ou a expiré. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleBackToRequest = () => {
    setStep('request');
    setActivationCode('');
  };

  return (
    <div className="min-h-screen bg-app-bg p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-cta text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'request' ? <Mail className="h-8 w-8" /> : <Key className="h-8 w-8" />}
          </div>
          <h1 className="text-3xl font-bold text-main mb-2">
            {step === 'request' ? 'Activez Norbert' : 'Saisissez votre code'}
          </h1>
          <p className="text-main opacity-70">
            {step === 'request' 
              ? 'Votre assistant IA pour la gestion de vos communications'
              : 'Entrez le code reçu par email pour activer votre compte'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-main">
              {step === 'request' ? 'Demander un code d\'activation' : 'Activation du compte'}
            </CardTitle>
            <CardDescription className="text-main opacity-70">
              {step === 'request' 
                ? 'Un code d\'activation vous sera envoyé par email'
                : 'Le code est valide 24h après l\'envoi'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'request' ? (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-main">
                    Adresse email *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-main">
                    Numéro de téléphone (optionnel)
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+33123456789"
                    className="w-full"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-cta hover:bg-cta/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Génération du code...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Recevoir le code par email
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleActivation} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="activation-code" className="text-sm font-medium text-main">
                    Code d'activation
                  </label>
                  <Input
                    id="activation-code"
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="Saisissez votre code ici"
                    className="w-full text-center text-lg font-mono tracking-wider"
                    maxLength={30}
                    required
                  />
                  <p className="text-xs text-main opacity-60 text-center">
                    Code envoyé à : {email}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-cta hover:bg-cta/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Activation en cours...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Activer mon compte
                      </>
                    )}
                  </Button>

                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full"
                    onClick={handleBackToRequest}
                    disabled={loading}
                  >
                    Demander un nouveau code
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🤖 Configuration automatique</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>✅ Compte Unipile créé automatiquement</li>
                <li>✅ Workflow N8N configuré et déployé</li>
                <li>✅ Canaux de communication connectés</li>
                <li>✅ Assistant IA prêt à fonctionner</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivationScreen;
