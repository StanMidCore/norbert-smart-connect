
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Zap } from 'lucide-react';
import { useNorbertUser } from '@/hooks/useNorbertUser';
import { useToast } from '@/hooks/use-toast';

interface ActivationScreenProps {
  onActivationSuccess: () => void;
}

const ActivationScreen = ({ onActivationSuccess }: ActivationScreenProps) => {
  const [email, setEmail] = useState('demo@norbert.ai');
  const [phoneNumber, setPhoneNumber] = useState('+33123456789');
  const { user, loading, error, createOrGetUser } = useNorbertUser();
  const { toast } = useToast();
  const [activating, setActivating] = useState(false);

  // If user exists, go to next step
  useEffect(() => {
    if (user && !activating) {
      console.log('Utilisateur trouvé, passage à l\'étape suivante');
      setTimeout(() => {
        onActivationSuccess();
      }, 500);
    }
  }, [user, activating, onActivationSuccess]);

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir votre adresse email",
        variant: "destructive",
      });
      return;
    }

    setActivating(true);
    
    try {
      const result = await createOrGetUser(email.trim(), phoneNumber?.trim());
      
      if (result) {
        toast({
          title: "Activation réussie !",
          description: `Bienvenue ${result.email} !`,
        });
        
        // Navigate after short delay
        setTimeout(() => {
          onActivationSuccess();
        }, 1000);
      }
    } catch (err) {
      console.error('Erreur activation:', err);
      toast({
        title: "Erreur d'activation",
        description: "Impossible d'activer votre compte. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setActivating(false);
    }
  };

  const handleSkipToChannels = () => {
    console.log('Navigation directe vers les canaux');
    onActivationSuccess();
  };

  if (loading && !activating) {
    return (
      <div className="min-h-screen bg-app-bg p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-main">Vérification de votre compte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-cta text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-main mb-2">
            Activez Norbert
          </h1>
          <p className="text-main opacity-70">
            Votre assistant IA pour la gestion de vos communications
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-main">Commencer</CardTitle>
            <CardDescription className="text-main opacity-70">
              Créez ou accédez à votre compte Norbert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleActivation} className="space-y-4">
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

              <div className="space-y-2">
                <Button 
                  type="submit" 
                  className="w-full bg-cta hover:bg-cta/90"
                  disabled={activating || loading}
                >
                  {activating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Activation en cours...
                    </>
                  ) : (
                    'Activer Norbert'
                  )}
                </Button>

                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full"
                  onClick={handleSkipToChannels}
                  disabled={activating || loading}
                >
                  Passer à la configuration des canaux
                </Button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">🚀 Prêt en 3 étapes</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Activez votre compte</li>
                <li>2. Connectez vos canaux (WhatsApp, Email...)</li>
                <li>3. Configurez votre profil IA</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivationScreen;
