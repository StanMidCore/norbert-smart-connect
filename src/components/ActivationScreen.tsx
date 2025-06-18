
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bot, Smartphone } from 'lucide-react';

interface ActivationScreenProps {
  onActivationSuccess: () => void;
}

const ActivationScreen = ({ onActivationSuccess }: ActivationScreenProps) => {
  const [activationCode, setActivationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivation = async () => {
    if (!activationCode.trim()) {
      setError('Veuillez saisir votre code d\'activation');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulation de la vérification du code
    setTimeout(() => {
      if (activationCode === 'DEMO2024' || activationCode.length >= 6) {
        onActivationSuccess();
      } else {
        setError('Code d\'activation invalide');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-bg p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-header-bg p-3 rounded-full">
              <Bot className="h-8 w-8 text-header-text" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-main">
            Bienvenue sur Norbert
          </CardTitle>
          <CardDescription className="text-main">
            Votre assistant IA multicanal pour ne plus jamais rater un client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activation-code" className="text-main">Code d'activation</Label>
            <Input
              id="activation-code"
              type="text"
              placeholder="Saisissez votre code"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              className="text-center tracking-wider"
            />
            {error && (
              <p className="text-sm text-alert">{error}</p>
            )}
          </div>
          
          <Button 
            onClick={handleActivation} 
            className="w-full bg-cta hover:bg-cta/90" 
            disabled={isLoading}
          >
            {isLoading ? 'Activation en cours...' : 'Activer mon compte'}
          </Button>

          <div className="text-center text-sm text-main">
            <p>Vous avez reçu votre code par email après votre achat.</p>
            <p className="mt-1 text-cta">Code de démo : DEMO2024</p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-xs text-main opacity-70">
            <Smartphone className="h-4 w-4" />
            <span>Disponible sur iOS et Android</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivationScreen;
