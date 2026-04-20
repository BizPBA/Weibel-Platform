import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Cloud,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface MicrosoftGroup {
  id: string;
  displayName: string;
  description: string | null;
  memberCount?: number;
}

interface CompanyAzureConfig {
  company_id: string;
  azure_tenant_id: string | null;
  azure_tenant_name: string | null;
  azure_client_id: string | null;
  azure_admin_consent_granted: boolean;
  azure_admin_consent_at: string | null;
  azure_sync_enabled: boolean;
  azure_sync_group_id: string | null;
  azure_sync_group_name: string | null;
  azure_auto_create_users: boolean;
  azure_last_sync_at: string | null;
  azure_last_sync_status: string;
  azure_last_sync_error: string | null;
}

interface SyncError {
  id: string;
  user_principal_name: string | null;
  display_name: string | null;
  error_type: string;
  error_message: string;
  raw_data: any;
  sync_attempt_at: string;
  resolved: boolean;
}

export function MicrosoftIntegrationCard() {
  const [config, setConfig] = useState<CompanyAzureConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [groups, setGroups] = useState<MicrosoftGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [syncErrors, setSyncErrors] = useState<SyncError[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    if (config?.company_id) {
      loadSyncErrors();
    }
  }, [config?.company_id]);

  const loadConfiguration = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (company) {
        setConfig({
          company_id: company.id,
          azure_tenant_id: company.azure_tenant_id,
          azure_tenant_name: company.azure_tenant_name,
          azure_client_id: company.azure_client_id,
          azure_admin_consent_granted: company.azure_admin_consent_granted || false,
          azure_admin_consent_at: company.azure_admin_consent_at,
          azure_sync_enabled: company.azure_sync_enabled || false,
          azure_sync_group_id: company.azure_sync_group_id,
          azure_sync_group_name: company.azure_sync_group_name,
          azure_auto_create_users: company.azure_auto_create_users !== false,
          azure_last_sync_at: company.azure_last_sync_at,
          azure_last_sync_status: company.azure_last_sync_status || 'never',
          azure_last_sync_error: company.azure_last_sync_error,
        });

        if (company.azure_admin_consent_granted) {
          loadGroups();
        }
      }
    } catch (err: any) {
      setError('Failed to load configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-microsoft-groups`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setGroups(result.groups);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleConnectMicrosoft = async () => {
    if (!config) return;

    setError(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-microsoft-consent-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success && result.consentUrl) {
        window.location.href = result.consentUrl;
      } else {
        throw new Error(result.error || 'Failed to generate consent URL');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Microsoft connection');
      setLoading(false);
    }
  };

  const handleToggleAutoCreate = async (enabled: boolean) => {
    if (!config) return;

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ azure_auto_create_users: enabled })
        .eq('id', config.company_id);

      if (updateError) throw updateError;

      setConfig({ ...config, azure_auto_create_users: enabled });
      setSuccess(`Auto-create users ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      setError('Failed to update setting');
    }
  };

  const handleGroupChange = async (groupId: string) => {
    if (!config) return;

    const selectedGroup = groups.find(g => g.id === groupId);

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          azure_sync_group_id: groupId,
          azure_sync_group_name: selectedGroup?.displayName || null,
        })
        .eq('id', config.company_id);

      if (updateError) throw updateError;

      setConfig({
        ...config,
        azure_sync_group_id: groupId,
        azure_sync_group_name: selectedGroup?.displayName || null,
      });
      setSuccess('Sync group updated successfully');
    } catch (err: any) {
      setError('Failed to update sync group');
    }
  };

  const handleManualSync = async () => {
    if (!config) return;

    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-company-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ trigger_type: 'manual' }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setSuccess(`Successfully synced ${result.users_synced || 0} users`);
        await loadConfiguration();
        await loadSyncErrors();
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const loadSyncErrors = async () => {
    if (!config?.company_id) return;

    setLoadingErrors(true);
    try {
      const { data, error } = await supabase
        .from('azure_sync_errors')
        .select('*')
        .eq('company_id', config.company_id)
        .eq('resolved', false)
        .order('sync_attempt_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncErrors(data || []);
    } catch (err) {
      console.error('Failed to load sync errors:', err);
    } finally {
      setLoadingErrors(false);
    }
  };

  const markErrorResolved = async (errorId: string) => {
    try {
      await supabase
        .from('azure_sync_errors')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', errorId);

      await loadSyncErrors();
    } catch (err) {
      console.error('Failed to resolve error:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = config?.azure_tenant_id && config?.azure_admin_consent_granted;
  const hasGroupSelected = config?.azure_sync_group_id;
  const canSync = isConnected && hasGroupSelected;

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Microsoft Integration</CardTitle>
              <CardDescription>
                Connect to Microsoft Azure AD for automatic user synchronization
              </CardDescription>
            </div>
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

          {!isConnected ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Cloud className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-lg mb-2">Connect to Microsoft</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Authorize this application to access your organization's Azure AD and sync users automatically.
                </p>
                <Button onClick={handleConnectMicrosoft} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {loading ? 'Connecting...' : 'Connect to Microsoft'}
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                  You will be redirected to Microsoft to grant admin consent for your organization.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Microsoft Connection</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-semibold text-green-900">Connected</p>
                  <p className="text-xs text-green-700 mt-1">
                    {config?.azure_tenant_name || 'Azure AD Authorized'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Sync Group</span>
                    {hasGroupSelected ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-2xl font-semibold">
                    {hasGroupSelected ? 'Selected' : 'Not Set'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {config?.azure_sync_group_name || 'Choose a group'}
                  </p>
                </div>
              </div>

              {isConnected && (
                <>
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">User Synchronization Settings</h4>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-create-toggle" className="text-base font-medium">
                            Automatically Create Users
                          </Label>
                          <p className="text-sm text-gray-600">
                            Create new users automatically when they are added to the sync group
                          </p>
                        </div>
                        <Switch
                          id="auto-create-toggle"
                          checked={config?.azure_auto_create_users}
                          onCheckedChange={handleToggleAutoCreate}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="group-select">Microsoft Group to Sync</Label>
                        <p className="text-sm text-gray-600 mb-2">
                          Select which Microsoft group's members should be synced to this platform
                        </p>
                        {loadingGroups ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                          </div>
                        ) : groups.length === 0 ? (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              No groups found. Make sure your Azure app has Group.Read.All permission.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Select
                            value={config?.azure_sync_group_id || ''}
                            onValueChange={handleGroupChange}
                          >
                            <SelectTrigger id="group-select">
                              <SelectValue placeholder="Choose a Microsoft group" />
                            </SelectTrigger>
                            <SelectContent>
                              {groups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{group.displayName}</span>
                                    {group.memberCount !== undefined && (
                                      <span className="ml-2 text-xs text-gray-500">
                                        ({group.memberCount} members)
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {config?.azure_last_sync_at && (
                        <div className="flex items-center justify-between text-sm pt-4 border-t">
                          <span className="text-gray-600">Last Sync:</span>
                          <div className="flex items-center gap-2">
                            <span>
                              {format(new Date(config.azure_last_sync_at), 'MMM d, yyyy HH:mm')}
                            </span>
                            <Badge
                              variant={
                                config.azure_last_sync_status === 'success'
                                  ? 'default'
                                  : config.azure_last_sync_status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {config.azure_last_sync_status}
                            </Badge>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleManualSync}
                        disabled={syncing || !canSync}
                        className="w-full"
                      >
                        {syncing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        {syncing ? 'Syncing Users...' : 'Sync Users Now'}
                      </Button>

                      {!hasGroupSelected && isConnected && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Please select a Microsoft group before syncing users.
                          </AlertDescription>
                        </Alert>
                      )}

                      {syncErrors.length > 0 && (
                        <div className="mt-6 pt-6 border-t space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-500" />
                              Sync Errors ({syncErrors.length})
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {syncErrors.map((error) => (
                              <div
                                key={error.id}
                                className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm text-gray-900">
                                        {error.display_name || error.user_principal_name || 'Unknown User'}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {error.error_type.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-700">{error.error_message}</p>
                                    {error.user_principal_name && (
                                      <p className="text-xs text-gray-500">{error.user_principal_name}</p>
                                    )}
                                    <p className="text-xs text-gray-400">
                                      {format(new Date(error.sync_attempt_at), 'MMM d, yyyy HH:mm')}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markErrorResolved(error.id)}
                                    className="ml-2"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
