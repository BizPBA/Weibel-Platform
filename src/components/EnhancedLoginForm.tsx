import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, AlertCircle, Building2 } from 'lucide-react';
import { MicrosoftLoginButton } from './MicrosoftLoginButton';
import { supabase } from '@/lib/supabase';
import { getCustomerAzureConfig } from '@/lib/azureAd';
import type { AzureTenantConfigEnhanced } from '@/types/azure-enhanced';

interface Customer {
  id: string;
  name: string;
  azure_sync_enabled: boolean;
  azure_tenant_id: string | null;
}

export function EnhancedLoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [azureConfig, setAzureConfig] = useState<AzureTenantConfigEnhanced | null>(null);
  const [loadingAzureConfig, setLoadingAzureConfig] = useState(false);

  useEffect(() => {
    loadCustomersWithAzure();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadAzureConfigForCustomer(selectedCustomerId);
    } else {
      setAzureConfig(null);
    }
  }, [selectedCustomerId]);

  const loadCustomersWithAzure = async () => {
    setLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, azure_sync_enabled, azure_tenant_id')
        .eq('azure_sync_enabled', true)
        .order('name');

      if (error) throw error;

      setCustomers(data || []);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadAzureConfigForCustomer = async (customerId: string) => {
    setLoadingAzureConfig(true);
    setAzureConfig(null);

    try {
      const config = await getCustomerAzureConfig(customerId);
      if (config && config.admin_consent_granted) {
        setAzureConfig(config);
      }
    } catch (err) {
      console.error('Error loading Azure config:', err);
    } finally {
      setLoadingAzureConfig(false);
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, is_active')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile?.is_active) {
          await supabase.auth.signOut();
          throw new Error('Your account has been deactivated. Please contact support.');
        }

        if (profile?.onboarding_completed) {
          navigate('/dashboard');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    console.log('Microsoft login initiated for customer:', selectedCustomerId);
  };

  const showMicrosoftLogin = azureConfig && azureConfig.admin_consent_granted;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="standard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="standard">Email Login</TabsTrigger>
              <TabsTrigger value="microsoft" disabled={customers.length === 0}>
                Microsoft Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standard" className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Use Microsoft Login for SSO</p>
              </div>
            </TabsContent>

            <TabsContent value="microsoft" className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-select">Select Your Organization</Label>
                  {loadingCustomers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : customers.length === 0 ? (
                    <Alert>
                      <Building2 className="h-4 w-4" />
                      <AlertDescription>
                        No organizations have Microsoft integration enabled yet.
                        Please contact your administrator.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      value={selectedCustomerId}
                      onValueChange={setSelectedCustomerId}
                    >
                      <SelectTrigger id="customer-select">
                        <SelectValue placeholder="Choose your organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {loadingAzureConfig && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">
                      Loading Microsoft configuration...
                    </span>
                  </div>
                )}

                {selectedCustomerId && !loadingAzureConfig && (
                  <>
                    {showMicrosoftLogin ? (
                      <>
                        <Alert className="bg-blue-50 border-blue-200">
                          <AlertDescription className="text-blue-900">
                            You will be redirected to Microsoft to sign in with your organization's
                            credentials.
                          </AlertDescription>
                        </Alert>

                        <MicrosoftLoginButton
                          tenantId={azureConfig!.tenant_id}
                          clientId={azureConfig!.client_id}
                          customerId={selectedCustomerId}
                          onLoginStart={handleMicrosoftLogin}
                          size="lg"
                          className="w-full"
                        />
                      </>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Microsoft integration is not fully configured for this organization.
                          Please contact your administrator.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}

                {!selectedCustomerId && !loadingCustomers && customers.length > 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Select your organization to continue with Microsoft Login
                  </div>
                )}
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or use email
                  </span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Switch to Email Login tab for standard authentication</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Don't have an account?{' '}
              <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
