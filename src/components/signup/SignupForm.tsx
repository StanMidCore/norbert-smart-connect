
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SignupFormProps {
  onComplete: (signupId: string, email: string) => void;
}

const SignupForm = ({ onComplete }: SignupFormProps) => {
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !businessName) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-signup', {
        body: { 
          email: email.trim(),
          business_name: businessName.trim()
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Inscription réussie !",
          description: "Vérifiez votre email pour continuer.",
        });
        onComplete(data.signup_id, email);
      } else {
        throw new Error(data?.error || 'Erreur lors de l\'inscription');
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Créer votre compte</CardTitle>
          <CardDescription>
            Commencez votre essai gratuit dès aujourd'hui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business">Nom de votre entreprise</Label>
              <Input
                id="business"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mon Entreprise"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Commencer mon essai gratuit'
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              En vous inscrivant, vous acceptez nos conditions d'utilisation
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupForm;
