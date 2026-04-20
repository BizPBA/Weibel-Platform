import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  parseState,
  exchangeCodeForToken,
  exchangeCodeForTokenCommon,
  getMicrosoftUserInfo,
  findOrCreateUserFromAzure,
  getCustomerAzureConfig,
  findCompanyByTenantId,
} from '@/lib/azureAd';
import { supabase } from '@/lib/supabase';

export default function MicrosoftCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Microsoft login...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        setStatus('error');
        setMessage('Microsoft authentication failed');
        setErrorDetails(errorDescription || error);
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authentication parameters');
        return;
      }

      const storedState = sessionStorage.getItem('microsoft_auth_state');
      const authFlow = sessionStorage.getItem('microsoft_auth_flow');

      if (state !== storedState) {
        setStatus('error');
        setMessage('Invalid authentication state. Please try again.');
        return;
      }

      sessionStorage.removeItem('microsoft_auth_state');
      sessionStorage.removeItem('microsoft_auth_flow');

      const redirectUri = `${window.location.origin}/auth/microsoft/callback`;

      if (authFlow === 'common') {
        await handleCommonFlowCallback(code, redirectUri);
      } else {
        await handleTenantSpecificCallback(code, state, redirectUri);
      }
    } catch (error) {
      console.error('Error in Microsoft callback:', error);
      setStatus('error');
      setMessage('An unexpected error occurred');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleCommonFlowCallback = async (code: string, redirectUri: string) => {
    const globalClientId = import.meta.env.VITE_MICROSOFT_CLIENTID || '5e1fc108-b19e-4a40-9cbf-f6b2e0169682';
    const globalClientSecret = import.meta.env.VITE_MICROSOFT_CLIENTSECRET_VALUE || '';

    setMessage('Exchanging authentication code...');
    const tokens = await exchangeCodeForTokenCommon(
      code,
      globalClientId,
      globalClientSecret,
      redirectUri
    );

    if (!tokens) {
      setStatus('error');
      setMessage('Failed to obtain access token');
      return;
    }

    setMessage('Identifying your organization...');
    const company = await findCompanyByTenantId(tokens.tenant_id);

    if (!company) {
      setStatus('error');
      setMessage('Your organization is not registered in this system');
      setErrorDetails(
        'Your Microsoft tenant is not connected to any company in our system. Please contact your administrator to set up the integration.'
      );
      return;
    }

    setMessage('Fetching your Microsoft profile...');
    const userInfo = await getMicrosoftUserInfo(tokens.access_token);

    if (!userInfo) {
      setStatus('error');
      setMessage('Failed to retrieve user information from Microsoft');
      return;
    }

    setMessage('Creating or updating your account...');
    const userId = await findOrCreateUserFromAzure(
      userInfo,
      company.id,
      tokens.tenant_id
    );

    if (!userId) {
      setStatus('error');
      setMessage('Failed to create or link user account');
      return;
    }

    await signInUser(userInfo.mail, userId);
  };

  const handleTenantSpecificCallback = async (code: string, state: string, redirectUri: string) => {
    const customerId = sessionStorage.getItem('microsoft_auth_customer_id');
    const tenantId = sessionStorage.getItem('microsoft_auth_tenant_id');

    sessionStorage.removeItem('microsoft_auth_customer_id');
    sessionStorage.removeItem('microsoft_auth_tenant_id');

    if (!customerId || !tenantId) {
      setStatus('error');
      setMessage('Invalid authentication state. Please try again.');
      return;
    }

    setMessage('Retrieving configuration...');
    const azureConfig = await getCustomerAzureConfig(customerId);

    if (!azureConfig) {
      setStatus('error');
      setMessage('Azure configuration not found for this organization');
      return;
    }

    setMessage('Exchanging authentication code...');
    const tokens = await exchangeCodeForToken(
      code,
      azureConfig.tenant_id,
      azureConfig.client_id,
      azureConfig.client_secret,
      redirectUri
    );

    if (!tokens) {
      setStatus('error');
      setMessage('Failed to obtain access token');
      return;
    }

    setMessage('Fetching your Microsoft profile...');
    const userInfo = await getMicrosoftUserInfo(tokens.access_token);

    if (!userInfo) {
      setStatus('error');
      setMessage('Failed to retrieve user information from Microsoft');
      return;
    }

    setMessage('Creating or updating your account...');
    const userId = await findOrCreateUserFromAzure(
      userInfo,
      azureConfig.company_id,
      azureConfig.tenant_id
    );

    if (!userId) {
      setStatus('error');
      setMessage('Failed to create or link user account');
      return;
    }

    await signInUser(userInfo.mail, userId);
  };

  const signInUser = async (email: string, userId: string) => {
    setMessage('Signing you in...');

    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: tempPassword,
    });

    if (signInError) {
      console.log('First sign-in attempt failed, user may need to use existing password');

      setStatus('error');
      setMessage('Account exists but needs password verification');
      setErrorDetails(
        'Your account has been linked to Microsoft, but you need to sign in with your existing password first. Please use the standard login form.'
      );
      return;
    }

    setStatus('success');
    setMessage('Successfully signed in!');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
            Microsoft Login
          </CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Please wait while we complete your login...</p>
            </div>
          )}

          {status === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Login successful! Redirecting to your dashboard...
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>

              {errorDetails && (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-700">{errorDetails}</p>
                </div>
              )}

              <Button
                onClick={() => navigate('/')}
                className="w-full"
                variant="outline"
              >
                Back to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
