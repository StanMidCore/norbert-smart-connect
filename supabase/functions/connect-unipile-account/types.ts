
export interface ProviderMapping {
  [key: string]: string;
}

export interface UnipileAuthRequest {
  type: string;
  providers: string[];
  expiresOn: string;
  api_url: string;
  success_redirect_url: string;
  failure_redirect_url: string;
}

export interface UnipileAccountRequest {
  provider: string;
}

export interface ConnectionResponse {
  success: boolean;
  qr_code?: string;
  phone_number?: string;
  requires_sms?: boolean;
  account_id?: string;
  authorization_url?: string;
  message?: string;
  error?: string;
  requires_manual_setup?: boolean;
}
