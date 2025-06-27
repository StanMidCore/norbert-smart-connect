
import StripeElements from './StripeElements';

interface StripePaymentProps {
  signupId: string;
  email: string;
  onComplete: () => void;
  onBack: () => void;
}

const StripePayment = ({ signupId, email, onComplete, onBack }: StripePaymentProps) => {
  return (
    <StripeElements 
      signupId={signupId}
      email={email}
      onComplete={onComplete}
      onBack={onBack}
    />
  );
};

export default StripePayment;
