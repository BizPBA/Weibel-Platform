import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminConsentResponse } from '@/types/azure-enhanced';

export default function AdminConsentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

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
      const { customerId } = stateData;

      if (!customerId) {
        throw new Error('Invalid state parameter - missing customer ID');
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .maybeSingle();

      if (customer) {
        setCustomerName(customer.name);
      }

      if (adminConsent === 'True') {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data: config, error: configError } = await supabase
          .from('azure_tenant_configs')
          .select('id')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (configError || !config) {
          throw new Error('Azure configuration not found for customer');
        }

        const { error: updateError } = await supabase
          .from('azure_tenant_configs')
          .update({
            admin_consent_granted: true,
            admin_consent_granted_at: new Date().toISOString(),
            admin_consent_granted_by: user.email || user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id);

        if (updateError) {
          throw updateError;
        }

        await supabase.from('company_audit_log').insert({
          company_id: (await getCurrentUserCompany()),
          user_id: user.id,
          action: 'azure_admin_consent_granted',
          entity_type: 'azure_tenant_config',
          entity_id: config.id,
          new_values: {
            customer_id: customerId,
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

  const getCurrentUserCompany = async (): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    return profile.company_id;
  };

  const handleContinue = () => {
    navigate('/customers');
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
                    Admin consent has been granted for {customerName || 'the customer'}.
                  </p>
                </div>

                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    You can now enable automatic user synchronization from Azure AD. Users will be
                    synced according to your configured settings and group filters.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3 pt-4">
                  <h4 className="font-medium text-sm">Next Steps:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="mr-2">1.</span>
                      <span>Enable automatic synchronization in security settings</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">2.</span>
                      <span>Configure group filtering (optional)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">3.</span>
                      <span>Run manual sync to import users immediately</span>
                    </li>
                  </ul>
                </div>

                <Button onClick={handleContinue} className="w-full">
                  Continue to Customers
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
                  <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
                    Go Back
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
