import { Button } from '@/components/ui/button';
import { generateMicrosoftLoginUrl, generateState } from '@/lib/azureAd';
import { useState } from 'react';

interface MicrosoftLoginButtonProps {
  tenantId: string;
  clientId: string;
  customerId: string;
  onLoginStart?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function MicrosoftLoginButton({
  tenantId,
  clientId,
  customerId,
  onLoginStart,
  size = 'md',
  className = '',
  disabled = false,
}: MicrosoftLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    try {
      setIsLoading(true);

      if (onLoginStart) {
        onLoginStart();
      }

      const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
      const state = generateState(customerId);

      sessionStorage.setItem('microsoft_auth_state', state);
      sessionStorage.setItem('microsoft_auth_customer_id', customerId);
      sessionStorage.setItem('microsoft_auth_tenant_id', tenantId);

      const loginUrl = generateMicrosoftLoginUrl(tenantId, clientId, redirectUri, state);

      window.location.href = loginUrl;
    } catch (error) {
      console.error('Error initiating Microsoft login:', error);
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-10',
    lg: 'h-11 text-lg',
  };

  return (
    <Button
      type="button"
      onClick={handleLogin}
      disabled={disabled || isLoading}
      className={`${sizeClasses[size]} bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white font-medium ${className}`}
      variant="default"
    >
      <svg
        className="w-5 h-5 mr-2"
        viewBox="0 0 21 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
      </svg>
      {isLoading ? 'Redirecting...' : 'Log ind med Microsoft'}
    </Button>
  );
}
