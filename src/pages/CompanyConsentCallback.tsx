import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CompanyConsentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleAdminConsent();
  }, []);

  const handleAdminConsent = async () => {
    try {
      const tenant = searchParams.get('tenant');
      const adminConsent = searchParams.get('admin_consent');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state');

      if (errorParam) {
        throw new Error(errorDescription || errorParam);
      }

      if (!state) {
        throw new Error('Missing state parameter');
      }

      const stateData = JSON.parse(atob(state));
      const { companyId } = stateData;

      if (!companyId) {
        throw new Error('Invalid state parameter - missing company ID');
      }

      if (adminConsent === 'True' && tenant) {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const { error: updateError } = await supabase.rpc('record_azure_admin_consent', {
          p_company_id: companyId,
          p_tenant_id: tenant,
        });

        if (updateError) {
          throw updateError;
        }

        await supabase.from('company_audit_log').insert({
          company_id: companyId,
          user_id: user.id,
          action: 'azure_admin_consent_granted',
          entity_type: 'company',
          entity_id: companyId,
          new_values: {
            tenant: tenant,
            admin_consent: true,
            granted_at: new Date().toISOString(),
          },
        });

        setSuccess(true);
      } else {
        throw new Error('Admin consent was not granted');
      }
    } catch (err: any) {
      console.error('Admin consent error:', err);
      setError(err.message || 'Failed to process admin consent');
      setSuccess(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleContinue = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Microsoft Admin Consent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {processing && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Processing admin consent...</p>
              </div>
            )}

            {!processing && success && (
              <>
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Consent Granted Successfully!</h3>
                  <p className="text-gray-600">
                    Admin consent has been granted for your organization.
                  </p>
                </div>

                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    You can now select a Microsoft group and sync users from your Azure AD tenant.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 pt-4">
                  <h4 className="font-medium text-sm">Next Steps:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>Select a Microsoft group to sync users from</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>Enable automatic user creation if desired</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>Run manual sync to import users immediately</span>
                    </li>
                  </ul>
                </div>

                <Button onClick={handleContinue} className="w-full">
                  Continue to Settings
                </Button>
              </>
            )}

            {!processing && !success && error && (
              <>
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Consent Failed</h3>
                  <p className="text-gray-600">
                    There was an error processing the admin consent.
                  </p>
                </div>

                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>

                <div className="space-y-3 pt-4">
                  <h4 className="font-medium text-sm">Common Issues:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Ensure you are a Global Administrator in Azure AD</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Check that the Azure app registration is configured correctly</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Verify the redirect URI matches in Azure</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/settings')} className="flex-1">
                    Go to Settings
                  </Button>
                  <Button onClick={() => window.location.reload()} className="flex-1">
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  );
}
