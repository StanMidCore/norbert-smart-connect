
import { useState } from 'react';
import SignupForm from './signup/SignupForm';
import EmailVerification from './signup/EmailVerification';
import StripePayment from './signup/StripePayment';

export type SignupStep = 'form' | 'verification' | 'payment' | 'channels' | 'profile';

interface SignupFlowProps {
  onComplete: () => void;
  onChannelSetup: () => void;
  onProfileSetup: () => void;
}

const SignupFlow = ({ onComplete, onChannelSetup, onProfileSetup }: SignupFlowProps) => {
  const [currentStep, setCurrentStep] = useState<SignupStep>('form');
  const [signupId, setSignupId] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleFormComplete = (id: string, userEmail: string) => {
    console.log('Formulaire complété:', { id, userEmail });
    setSignupId(id);
    setEmail(userEmail);
    setCurrentStep('verification');
  };

  const handleEmailVerified = () => {
    console.log('Email vérifié pour:', email);
    setCurrentStep('payment');
  };

  const handlePaymentComplete = () => {
    console.log('Paiement complété, redirection vers les canaux...');
    // Rediriger vers les canaux au lieu de dashboard
    onChannelSetup();
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setSignupId(null);
    setEmail('');
  };

  const handleBackToVerification = () => {
    setCurrentStep('verification');
  };

  if (currentStep === 'form') {
    return <SignupForm onComplete={handleFormComplete} />;
  }

  if (currentStep === 'verification') {
    return (
      <EmailVerification
        email={email}
        signupId={signupId!}
        onVerified={handleEmailVerified}
        onBack={handleBackToForm}
      />
    );
  }

  if (currentStep === 'payment') {
    return (
      <StripePayment
        signupId={signupId!}
        email={email}
        onComplete={handlePaymentComplete}
        onBack={handleBackToVerification}
      />
    );
  }

  return null;
};

export default SignupFlow;
