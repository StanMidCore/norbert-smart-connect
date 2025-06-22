
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SignupFormProps {
  onComplete: (signupId: string, email: string) => void;
}

const SignupForm = ({ onComplete }: SignupFormProps) => {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Créer l'entrée dans signup_process
      const { data, error } = await supabase.functions.invoke('create-signup', {
        body: {
          email: email.trim(),
          business_name: businessName.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Compte créé ! Vérifiez votre email.');
        onComplete(data.signup_id, email);
      } else {
        throw new Error(data.error || 'Erreur lors de la création du compte');
      }
    } catch (err) {
      console.error('Erreur signup:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Créer votre compte</CardTitle>
          <CardDescription>
            Commencez votre essai gratuit de 15 jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Adresse email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="business" className="block text-sm font-medium mb-1">
                Nom de votre entreprise
              </label>
              <Input
                id="business"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nom de votre entreprise"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création...' : 'Continuer'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupForm;
