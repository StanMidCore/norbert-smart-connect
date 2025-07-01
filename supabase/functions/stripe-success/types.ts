
export interface StripeSuccessRequest {
  session_id: string;
  signup_id: string;
}

export interface SignupData {
  id: string;
  email: string;
  business_name: string;
  payment_completed: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface ProcessingResult {
  success: boolean;
  user_email: string;
  user_id?: string;
  workflow_created: boolean;
  workflow_data?: any;
  channels_cleaned: boolean;
  cleanup_data?: any;
}

export interface ErrorResult {
  success: false;
  error: string;
}
