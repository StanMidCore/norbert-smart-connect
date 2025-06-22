
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  signupId: string;
  onVerified: () => void;
  onBack: () => void;
}

const EmailVerification = ({ email, signupId, onVerified, onBack }: EmailVerificationProps) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-email', {
        body: {
          signup_id: signupId,
          verification_code: verificationCode.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Email vérifié avec succès !');
        onVerified();
      } else {
        throw new Error(data.error || 'Code de vérification invalide');
      }
    } catch (err) {
      console.error('Erreur vérification:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('resend-verification', {
        body: { signup_id: signupId }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Email de vérification renvoyé !');
      } else {
        throw new Error(data.error || 'Erreur lors du renvoi');
      }
    } catch (err) {
      console.error('Erreur renvoi:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur de renvoi');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Vérifiez votre email</CardTitle>
          <CardDescription>
            Nous avons envoyé un code de vérification à<br />
            <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1">
                Code de vérification
              </label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Entrez le code reçu"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Vérification...' : 'Vérifier'}
            </Button>
          </form>

          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Envoi...' : 'Renvoyer le code'}
            </Button>

            <Button variant="ghost" onClick={onBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Modifier l'adresse email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;
