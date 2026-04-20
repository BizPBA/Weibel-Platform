import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AzureUser {
  id: string;
  userPrincipalName: string;
  displayName: string;
  givenName: string;
  surname: string;
  mail: string;
  mobilePhone: string | null;
  jobTitle: string | null;
}

interface AzureGroup {
  id: string;
  displayName: string;
}

interface SyncStats {
  usersFound: number;
  usersCreated: number;
  usersUpdated: number;
  usersDeactivated: number;
  usersReactivated: number;
  usersSkipped: number;
  errors: Array<{ user: string; error: string }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { customer_id } = await req.json();

    if (!customer_id) {
      throw new Error('customer_id is required');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Only admins can sync users');
    }

    const { data: azureConfig } = await supabase
      .from('azure_tenant_configs')
      .select('*')
      .eq('customer_id', customer_id)
      .eq('company_id', profile.company_id)
      .single();

    if (!azureConfig) {
      throw new Error('Azure configuration not found');
    }

    if (!azureConfig.admin_consent_granted) {
      throw new Error('Admin consent required. Please grant consent before syncing users.');
    }

    let logId: string;
    { 
      const { data: log } = await supabase
        .from('azure_sync_logs')
        .insert({
          config_id: azureConfig.id,
          customer_id: customer_id,
          company_id: profile.company_id,
          sync_status: 'in_progress',
          triggered_by: user.id,
        })
        .select('id')
        .single();
      
      logId = log!.id;
    }

    await supabase
      .from('azure_tenant_configs')
      .update({ last_sync_status: 'in_progress' })
      .eq('id', azureConfig.id);

    const accessToken = await getAzureAccessToken(
      azureConfig.tenant_id,
      azureConfig.client_id,
      azureConfig.client_secret
    );

    const stats: SyncStats = {
      usersFound: 0,
      usersCreated: 0,
      usersUpdated: 0,
      usersDeactivated: 0,
      usersReactivated: 0,
      usersSkipped: 0,
      errors: [],
    };

    let azureUsers: AzureUser[] = [];
    let azureUserIds: Set<string> = new Set();

    if (azureConfig.filter_by_groups && Array.isArray(azureConfig.sync_groups) && azureConfig.sync_groups.length > 0) {
      for (const groupId of azureConfig.sync_groups) {
        try {
          const groupUsers = await fetchGroupMembers(accessToken, groupId as string);
          groupUsers.forEach(user => {
            if (!azureUserIds.has(user.id)) {
              azureUsers.push(user);
              azureUserIds.add(user.id);
            }
          });
        } catch (err: any) {
          stats.errors.push({
            user: `Group ${groupId}`,
            error: `Failed to fetch group members: ${err.message}`,
          });
        }
      }
    } else {
      azureUsers = await fetchAllUsers(accessToken);
      azureUsers.forEach(user => azureUserIds.add(user.id));
    }

    stats.usersFound = azureUsers.length;

    for (const azureUser of azureUsers) {
      try {
        const userGroups = azureConfig.filter_by_groups
          ? await fetchUserGroups(accessToken, azureUser.id)
          : [];

        await upsertUser(supabase, azureUser, azureConfig, profile.company_id, userGroups, stats);
      } catch (err: any) {
        stats.errors.push({
          user: azureUser.displayName,
          error: err.message,
        });
        stats.usersSkipped++;
      }
    }

    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id, azure_user_id, is_active')
      .eq('company_id', profile.company_id)
      .eq('azure_tenant_id', azureConfig.tenant_id)
      .not('azure_user_id', 'is', null);

    if (existingUsers) {
      for (const existingUser of existingUsers) {
        if (existingUser.azure_user_id && !azureUserIds.has(existingUser.azure_user_id)) {
          if (existingUser.is_active) {
            await supabase.rpc('deactivate_user', {
              user_id: existingUser.id,
              reason: 'User removed from Azure AD or sync groups',
            });
            stats.usersDeactivated++;
          }
        } else if (existingUser.azure_user_id && azureUserIds.has(existingUser.azure_user_id) && !existingUser.is_active) {
          await supabase.rpc('reactivate_user', {
            user_id: existingUser.id,
          });
          stats.usersReactivated++;
        }
      }
    }

    const duration = Date.now() - startTime;

    await supabase
      .from('azure_sync_logs')
      .update({
        sync_completed_at: new Date().toISOString(),
        sync_status: stats.errors.length > 0 ? 'partial' : 'success',
        users_found: stats.usersFound,
        users_created: stats.usersCreated,
        users_updated: stats.usersUpdated,
        users_deactivated: stats.usersDeactivated,
        users_reactivated: stats.usersReactivated,
        users_skipped: stats.usersSkipped,
        errors: stats.errors,
        sync_duration_ms: duration,
      })
      .eq('id', logId);

    await supabase
      .from('azure_tenant_configs')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: stats.errors.length === 0 ? 'success' : 'partial',
        last_sync_error: stats.errors.length > 0 ? `${stats.errors.length} errors occurred` : null,
        sync_users_count: stats.usersCreated + stats.usersUpdated + stats.usersReactivated,
      })
      .eq('id', azureConfig.id);

    return new Response(
      JSON.stringify({
        success: true,
        log_id: logId,
        users_synced: stats.usersCreated + stats.usersUpdated + stats.usersReactivated,
        users_created: stats.usersCreated,
        users_updated: stats.usersUpdated,
        users_deactivated: stats.usersDeactivated,
        users_reactivated: stats.usersReactivated,
        users_skipped: stats.usersSkipped,
        errors: stats.errors,
        duration_ms: duration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error syncing Azure users:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAzureAccessToken(
  tenantId: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const tokenResponse = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error('Failed to get Azure access token');
  }

  const { access_token } = await tokenResponse.json();
  return access_token;
}

async function fetchAllUsers(accessToken: string): Promise<AzureUser[]> {
  const usersResponse = await fetch(
    'https://graph.microsoft.com/v1.0/users?$select=id,userPrincipalName,displayName,givenName,surname,mail,mobilePhone,jobTitle',
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  if (!usersResponse.ok) {
    throw new Error('Failed to fetch users from Azure AD');
  }

  const { value } = await usersResponse.json();
  return value;
}

async function fetchGroupMembers(accessToken: string, groupId: string): Promise<AzureUser[]> {
  const membersResponse = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,userPrincipalName,displayName,givenName,surname,mail,mobilePhone,jobTitle`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  if (!membersResponse.ok) {
    throw new Error(`Failed to fetch members for group ${groupId}`);
  }

  const { value } = await membersResponse.json();
  return value.filter((member: any) => member['@odata.type'] === '#microsoft.graph.user');
}

async function fetchUserGroups(accessToken: string, userId: string): Promise<AzureGroup[]> {
  const groupsResponse = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userId}/memberOf?$select=id,displayName`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  if (!groupsResponse.ok) {
    return [];
  }

  const { value } = await groupsResponse.json();
  return value.filter((item: any) => item['@odata.type'] === '#microsoft.graph.group');
}

async function upsertUser(
  supabase: any,
  azureUser: AzureUser,
  config: any,
  companyId: string,
  userGroups: AzureGroup[],
  stats: SyncStats
): Promise<void> {
  const profileData = {
    email: azureUser.mail || azureUser.userPrincipalName,
    full_name: azureUser.displayName,
    phone: azureUser.mobilePhone,
    azure_user_id: azureUser.id,
    azure_principal_name: azureUser.userPrincipalName,
    azure_tenant_id: config.tenant_id,
    azure_groups: userGroups.map(g => ({ id: g.id, name: g.displayName })),
    last_azure_sync: new Date().toISOString(),
  };

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('azure_user_id', azureUser.id)
    .maybeSingle();

  if (existingProfile) {
    await supabase
      .from('profiles')
      .update({
        full_name: profileData.full_name,
        phone: profileData.phone,
        azure_groups: profileData.azure_groups,
        last_azure_sync: profileData.last_azure_sync,
      })
      .eq('id', existingProfile.id);
    
    stats.usersUpdated++;
  } else if (config.auto_create_users) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        ...profileData,
        company_id: companyId,
        role: config.default_user_role,
        is_manual_creation: true,
        is_active: true,
      });

    if (insertError) {
      throw insertError;
    }
    
    stats.usersCreated++;
  } else {
    stats.usersSkipped++;
  }
}