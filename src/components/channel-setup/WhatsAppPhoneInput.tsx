
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppPhoneInputProps {
  accountId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const WhatsAppPhoneInput = ({ accountId, onSuccess, onCancel }: WhatsAppPhoneInputProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Numéro requis",
        description: "Veuillez saisir votre numéro WhatsApp Business",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-whatsapp-sms', {
        body: {
          account_id: accountId,
          phone_number: phoneNumber,
          action: 'send_code'
        }
      });

      if (error) throw error;

      if (data.success) {
        setStep('code');
        toast({
          title: "Code envoyé",
          description: "Un code de vérification a été envoyé par SMS",
        });
      } else {
        throw new Error(data.error || 'Erreur envoi SMS');
      }
    } catch (error) {
      console.error('Erreur envoi code:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le code SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      toast({
        title: "Code requis",
        description: "Veuillez saisir le code de vérification",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-whatsapp-sms', {
        body: {
          account_id: accountId,
          phone_number: phoneNumber,
          verification_code: verificationCode,
          action: 'verify_code'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "WhatsApp connecté",
          description: "Votre compte WhatsApp Business a été connecté avec succès",
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Code invalide');
      }
    } catch (error) {
      console.error('Erreur vérification code:', error);
      toast({
        title: "Erreur",
        description: error.message || "Code de vérification invalide",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep('phone');
    setVerificationCode('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <span>WhatsApp Business</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'phone' ? (
          <>
            <div>
              <Label htmlFor="phone">Numéro WhatsApp Business</Label>
              <div className="flex space-x-2 mt-1">
                <Phone className="h-4 w-4 mt-3 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Format international avec indicatif pays
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleSendCode}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Envoi...
                  </>
                ) : (
                  'Envoyer code SMS'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Code reçu par SMS sur {phoneNumber}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleVerifyCode}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Vérification...
                  </>
                ) : (
                  'Vérifier'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleRetry}
                disabled={loading}
              >
                Recommencer
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppPhoneInput;
