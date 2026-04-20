import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Settings,
  Users,
  RefreshCw,
  Loader2,
  ExternalLink,
  Cloud,
} from 'lucide-react';
import { AzureConfigModal } from './AzureConfigModal';
import {
  getCustomerAzureConfig,
  updateAzureConfig,
  triggerAzureUserSync,
} from '@/lib/azureAd';
import type { AzureTenantConfigEnhanced, SecurityIntegrationStatus } from '@/types/azure-enhanced';
import { format } from 'date-fns';

interface SecuritySettingsCardProps {
  customerId: string;
  companyId: string;
  customerName: string;
  onSyncComplete?: () => void;
}

export function SecuritySettingsCard({
  customerId,
  companyId,
  customerName,
  onSyncComplete,
}: SecuritySettingsCardProps) {
  const [config, setConfig] = useState<AzureTenantConfigEnhanced | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, [customerId]);

  const loadConfiguration = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCustomerAzureConfig(customerId);
      setConfig(data);
    } catch (err) {
      setError('Failed to load security configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    if (!config) return;

    try {
      await updateAzureConfig(config.id, { sync_enabled: enabled });
      setConfig({ ...config, sync_enabled: enabled });
      setSuccess(`Sync ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      setError('Failed to update sync settings');
    }
  };

  const handleManualSync = async () => {
    if (!config) return;

    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await triggerAzureUserSync(customerId);

      if (result.success) {
        setSuccess(`Successfully synced ${result.users_synced || 0} users`);
        await loadConfiguration();
        onSyncComplete?.();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleRequestAdminConsent = () => {
    if (!config) return;

    const state = btoa(
      JSON.stringify({
        customerId,
        timestamp: Date.now(),
        action: 'admin_consent',
      })
    );

    const consentUrl = buildAdminConsentUrl(config.tenant_id, config.client_id, state);
    window.location.href = consentUrl;
  };

  const buildAdminConsentUrl = (tenantId: string, clientId: string, state: string): string => {
    const redirectUri = encodeURIComponent(`${window.location.origin}/auth/microsoft/admin-consent`);
    return `https://login.microsoftonline.com/${tenantId}/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  };

  const getIntegrationStatus = (): SecurityIntegrationStatus => {
    if (!config) {
      return {
        isConfigured: false,
        adminConsentGranted: false,
        syncEnabled: false,
        lastSync: null,
        lastSyncStatus: 'never',
        userCount: 0,
        groupCount: 0,
      };
    }

    const syncGroups = Array.isArray(config.sync_groups) ? config.sync_groups : [];

    return {
      isConfigured: true,
      adminConsentGranted: config.admin_consent_granted,
      syncEnabled: config.sync_enabled,
      lastSync: config.last_sync_at,
      lastSyncStatus: config.last_sync_status,
      userCount: config.sync_users_count,
      groupCount: syncGroups.length,
    };
  };

  const status = getIntegrationStatus();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Security & Integration</CardTitle>
                <CardDescription>Microsoft Azure AD Integration for {customerName}</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigModalOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {!status.isConfigured ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Cloud className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-2">Microsoft Integration Not Configured</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Set up Azure AD integration to enable Single Sign-On and automatic user
                  synchronization for this customer.
                </p>
                <Button onClick={() => setConfigModalOpen(true)}>
                  <Cloud className="h-4 w-4 mr-2" />
                  Set Up Integration
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Configuration</span>
                    {status.isConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-2xl font-semibold">
                    {status.isConfigured ? 'Active' : 'Not Set'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Azure AD Configured</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Admin Consent</span>
                    {status.adminConsentGranted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-2xl font-semibold">
                    {status.adminConsentGranted ? 'Granted' : 'Required'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Permission Status</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Users Synced</span>
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-semibold">{status.userCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {status.groupCount > 0 ? `From ${status.groupCount} groups` : 'All users'}
                  </p>
                </div>
              </div>

              {!status.adminConsentGranted && (
                <Alert className="bg-yellow-50 text-yellow-900 border-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      Admin consent is required before users can be synchronized from Azure AD.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-4"
                      onClick={handleRequestAdminConsent}
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Grant Consent
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Synchronization Settings</h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sync-toggle" className="text-base font-medium">
                        Automatic User Synchronization
                      </Label>
                      <p className="text-sm text-gray-600">
                        Automatically sync users from Azure AD every{' '}
                        {config?.auto_sync_interval_hours || 24} hours
                      </p>
                    </div>
                    <Switch
                      id="sync-toggle"
                      checked={status.syncEnabled}
                      onCheckedChange={handleToggleSync}
                      disabled={!status.adminConsentGranted}
                    />
                  </div>

                  {status.lastSync && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Sync:</span>
                      <div className="flex items-center gap-2">
                        <span>{format(new Date(status.lastSync), 'MMM d, yyyy HH:mm')}</span>
                        <Badge
                          variant={
                            status.lastSyncStatus === 'success'
                              ? 'default'
                              : status.lastSyncStatus === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {status.lastSyncStatus}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleManualSync}
                      disabled={syncing || !status.adminConsentGranted}
                      className="flex-1"
                    >
                      {syncing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      {syncing ? 'Syncing...' : 'Sync Now'}
                    </Button>

                    {config?.filter_by_groups && (
                      <Button variant="outline" onClick={() => setConfigModalOpen(true)}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Groups ({status.groupCount})
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {config && (
                <div className="border-t pt-6">
                  <h4 className="font-medium mb-3">Configuration Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Tenant ID:</span>
                      <p className="font-mono text-xs mt-1 break-all">
                        {config.tenant_id.substring(0, 8)}...
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Domain:</span>
                      <p className="mt-1">{config.azure_domain || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Auto-create Users:</span>
                      <p className="mt-1">{config.auto_create_users ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Default Role:</span>
                      <p className="mt-1 capitalize">
                        {config.default_user_role.replace('_', ' ')}
                      </p>
                    </div>
                    {config.filter_by_groups && (
                      <div className="col-span-2">
                        <span className="text-gray-600">Group Filtering:</span>
                        <p className="mt-1">
                          Enabled - Only users in specified groups will be synced
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {config && (
        <AzureConfigModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          customerId={customerId}
          companyId={companyId}
          onSuccess={() => {
            loadConfiguration();
            setSuccess('Configuration updated successfully');
          }}
        />
      )}
    </>
  );
}
