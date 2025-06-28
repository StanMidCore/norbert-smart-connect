
import PaymentForm from './PaymentForm';

interface StripePaymentProps {
  signupId: string;
  email: string;
  onComplete: () => void;
  onBack: () => void;
}

const StripePayment = ({ signupId, email, onComplete, onBack }: StripePaymentProps) => {
  return (
    <PaymentForm 
      signupId={signupId}
      email={email}
      onComplete={onComplete}
      onBack={onBack}
    />
  );
};

export default StripePayment;
