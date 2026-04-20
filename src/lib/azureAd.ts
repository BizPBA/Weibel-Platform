import { supabase } from './supabase';
import type { AzureTenantConfigEnhanced } from '@/types/azure-enhanced';

export async function getCustomerAzureConfig(customerId: string): Promise<AzureTenantConfigEnhanced | null> {
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('company_id')
      .eq('id', customerId)
      .maybeSingle();

    if (customerError || !customer?.company_id) {
      console.error('Error fetching customer:', customerError);
      return null;
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', customer.company_id)
      .maybeSingle();

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      return null;
    }

    if (!company.azure_tenant_id || !company.azure_admin_consent_granted) {
      return null;
    }

    return {
      id: company.id,
      customer_id: customerId,
      company_id: company.id,
      tenant_id: company.azure_tenant_id,
      tenant_name: company.azure_tenant_name || null,
      azure_domain: null,
      client_id: company.azure_client_id || '',
      client_secret: company.azure_client_secret || '',
      admin_consent_granted: company.azure_admin_consent_granted || false,
      admin_consent_granted_at: company.azure_admin_consent_at || null,
      admin_consent_granted_by: null,
      sync_enabled: company.azure_sync_enabled || false,
      filter_by_groups: false,
      sync_groups: company.azure_sync_group_id ? [company.azure_sync_group_id] : [],
      auto_sync_interval_hours: 24,
      last_sync_at: company.azure_last_sync_at || null,
      last_sync_status: (company.azure_last_sync_status as 'never' | 'success' | 'failed' | 'in_progress') || 'never',
      last_sync_error: company.azure_last_sync_error || null,
      sync_users_count: 0,
      auto_create_users: company.azure_auto_create_users || false,
      default_user_role: 'employee',
      sync_user_photos: false,
      created_at: company.created_at,
      created_by: null,
      updated_at: company.created_at,
      updated_by: null,
    };
  } catch (error) {
    console.error('Error in getCustomerAzureConfig:', error);
    return null;
  }
}

export function generateMicrosoftLoginUrl(
  tenantId: string,
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);

  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('scope', 'openid profile email User.Read');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return authUrl.toString();
}

export function generateCommonMicrosoftLoginUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');

  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('scope', 'openid profile email User.Read');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return authUrl.toString();
}

export function generateState(customerId?: string): string {
  const randomString = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return btoa(JSON.stringify({ customerId: customerId || null, rand: randomString, ts: timestamp }));
}

export function parseState(state: string): { customerId: string | null } | null {
  try {
    const decoded = JSON.parse(atob(state));
    return { customerId: decoded.customerId || null };
  } catch {
    return null;
  }
}

export function decodeIdToken(idToken: string): any {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Error decoding ID token:', error);
    return null;
  }
}

export async function exchangeCodeForToken(
  code: string,
  tenantId: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string } | null> {
  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      client_id: clientId,
      scope: 'openid profile email User.Read',
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange error:', errorData);
      return null;
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      id_token: data.id_token,
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
}

export async function exchangeCodeForTokenCommon(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string; tenant_id: string } | null> {
  try {
    const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const body = new URLSearchParams({
      client_id: clientId,
      scope: 'openid profile email User.Read',
      code: code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange error:', errorData);
      return null;
    }

    const data = await response.json();

    const idTokenPayload = decodeIdToken(data.id_token);
    if (!idTokenPayload || !idTokenPayload.tid) {
      console.error('Failed to extract tenant ID from token');
      return null;
    }

    return {
      access_token: data.access_token,
      id_token: data.id_token,
      tenant_id: idTokenPayload.tid,
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
}

export async function getMicrosoftUserInfo(accessToken: string): Promise<{
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
} | null> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user info:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      displayName: data.displayName,
      mail: data.mail || data.userPrincipalName,
      userPrincipalName: data.userPrincipalName,
      jobTitle: data.jobTitle,
    };
  } catch (error) {
    console.error('Error fetching Microsoft user info:', error);
    return null;
  }
}

export async function findCompanyByTenantId(tenantId: string): Promise<{
  id: string;
  name: string;
  azure_client_id: string;
  azure_client_secret: string;
} | null> {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, azure_client_id, azure_client_secret')
      .eq('azure_tenant_id', tenantId)
      .eq('azure_admin_consent_granted', true)
      .maybeSingle();

    if (error || !company) {
      console.error('Error finding company by tenant ID:', error);
      return null;
    }

    return company;
  } catch (error) {
    console.error('Error in findCompanyByTenantId:', error);
    return null;
  }
}

export async function findOrCreateUserFromAzure(
  azureUser: {
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
    jobTitle?: string;
  },
  companyId: string,
  tenantId: string
): Promise<string | null> {
  try {
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('azure_user_id', azureUser.id)
      .maybeSingle();

    if (existingProfile) {
      return existingProfile.id;
    }

    const { data: emailProfile, error: emailError } = await supabase
      .from('profiles')
      .select('id, azure_user_id')
      .eq('email', azureUser.mail)
      .maybeSingle();

    if (emailProfile) {
      if (!emailProfile.azure_user_id) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            azure_user_id: azureUser.id,
            azure_principal_name: azureUser.userPrincipalName,
            azure_tenant_id: tenantId,
            last_azure_sync: new Date().toISOString(),
            job_title: azureUser.jobTitle || null,
          })
          .eq('id', emailProfile.id);

        if (updateError) {
          console.error('Error linking existing user to Azure:', updateError);
          return null;
        }
      }
      return emailProfile.id;
    }

    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: azureUser.mail,
      password: tempPassword,
      options: {
        data: {
          full_name: azureUser.displayName,
          azure_user_id: azureUser.id,
          azure_principal_name: azureUser.userPrincipalName,
          azure_tenant_id: tenantId,
          job_title: azureUser.jobTitle || null,
        },
      },
    });

    if (signUpError || !authData.user) {
      console.error('Error creating user:', signUpError);
      return null;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        company_id: companyId,
        full_name: azureUser.displayName,
        role: 'employee',
        onboarding_completed: true,
        is_active: true,
        azure_user_id: azureUser.id,
        azure_principal_name: azureUser.userPrincipalName,
        azure_tenant_id: tenantId,
        last_azure_sync: new Date().toISOString(),
        job_title: azureUser.jobTitle || null,
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating new user profile:', updateError);
      return null;
    }

    return authData.user.id;
  } catch (error) {
    console.error('Error in findOrCreateUserFromAzure:', error);
    return null;
  }
}
