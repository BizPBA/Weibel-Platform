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

    const { trigger_type = 'manual' } = await req.json();

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Only admins can sync users');
    }

    const companyId = profile.company_id;

    // Get company Azure config
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company || !company.azure_tenant_id) {
      throw new Error('Azure integration not configured');
    }

    if (!company.azure_admin_consent_granted) {
      throw new Error('Admin consent required. Please grant consent before syncing users.');
    }

    if (!company.azure_sync_group_id) {
      throw new Error('No sync group configured. Please select a Microsoft group to sync from.');
    }

    // Get global Azure credentials
    const clientId = Deno.env.get('MICROSOFT_CLIENTID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENTSECRET_VALUE');

    if (!clientId || !clientSecret) {
      throw new Error('Microsoft credentials not configured');
    }

    // Get Azure access token
    const accessToken = await getAzureAccessToken(
      company.azure_tenant_id,
      clientId,
      clientSecret
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

    // Fetch users from the specified group
    const azureUsers = await fetchGroupMembers(accessToken, company.azure_sync_group_id);
    stats.usersFound = azureUsers.length;

    const azureUserIds = new Set(azureUsers.map(u => u.id));

    // Process each user from Azure
    for (const azureUser of azureUsers) {
      try {
        await upsertUser(supabase, azureUser, company, stats);
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error';
        const errorType = categorizeError(err);

        stats.errors.push({
          user: azureUser.displayName,
          error: errorMessage,
        });
        stats.usersSkipped++;

        // Log error to database for detailed review
        await logSyncError(supabase, {
          companyId: company.id,
          userPrincipalName: azureUser.userPrincipalName || azureUser.mail,
          displayName: azureUser.displayName,
          errorType: errorType,
          errorMessage: errorMessage,
          rawData: azureUser,
        });
      }
    }

    // Deactivate users not in the group anymore
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id, azure_user_id, is_active, email')
      .eq('company_id', companyId)
      .not('azure_user_id', 'is', null);

    if (existingUsers) {
      for (const existingUser of existingUsers) {
        if (existingUser.azure_user_id) {
          if (!azureUserIds.has(existingUser.azure_user_id)) {
            // User is not in the group anymore - deactivate
            if (existingUser.is_active) {
              await supabase.rpc('deactivate_user', {
                user_id: existingUser.id,
                reason: `Removed from Microsoft group: ${company.azure_sync_group_name || company.azure_sync_group_id}`,
              });
              stats.usersDeactivated++;
            }
          } else {
            // User is in the group - reactivate if needed
            if (!existingUser.is_active) {
              await supabase.rpc('reactivate_user', {
                user_id: existingUser.id,
              });
              stats.usersReactivated++;
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // Log the sync
    await supabase.rpc('log_company_azure_sync', {
      p_company_id: companyId,
      p_status: stats.errors.length === 0 ? 'success' : 'partial',
      p_users_found: stats.usersFound,
      p_users_created: stats.usersCreated,
      p_users_updated: stats.usersUpdated,
      p_users_deactivated: stats.usersDeactivated,
      p_users_reactivated: stats.usersReactivated,
      p_users_skipped: stats.usersSkipped,
      p_sync_group_id: company.azure_sync_group_id,
      p_sync_group_name: company.azure_sync_group_name,
      p_errors: stats.errors,
      p_error_message: stats.errors.length > 0 ? `${stats.errors.length} errors occurred` : null,
      p_trigger_type: trigger_type,
      p_sync_duration_ms: duration,
    });

    return new Response(
      JSON.stringify({
        success: true,
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
    console.error('Error syncing company users:', error);
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
    const error = await tokenResponse.text();
    throw new Error(`Failed to get Azure access token: ${error}`);
  }

  const { access_token } = await tokenResponse.json();
  return access_token;
}

async function fetchGroupMembers(accessToken: string, groupId: string): Promise<AzureUser[]> {
  const members: AzureUser[] = [];
  let nextLink: string | null = `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$select=id,userPrincipalName,displayName,givenName,surname,mail,mobilePhone,jobTitle`;

  while (nextLink) {
    const response = await fetch(nextLink, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch group members: ${error}`);
    }

    const data = await response.json();
    const users = data.value.filter((member: any) => 
      member['@odata.type'] === '#microsoft.graph.user'
    );
    members.push(...users);
    nextLink = data['@odata.nextLink'] || null;
  }

  return members;
}

async function upsertUser(
  supabase: any,
  azureUser: AzureUser,
  company: any,
  stats: SyncStats
): Promise<void> {
  const email = azureUser.mail || azureUser.userPrincipalName;

  if (!email) {
    throw new Error('Missing email address');
  }

  if (!azureUser.displayName) {
    throw new Error('Missing display name');
  }

  // First, try to find user by Azure ID
  let existingProfile = await supabase
    .from('profiles')
    .select('id, is_active, job_title')
    .eq('azure_user_id', azureUser.id)
    .eq('company_id', company.id)
    .maybeSingle();

  // If not found by Azure ID, try to find by email in the same company
  if (!existingProfile.data) {
    existingProfile = await supabase
      .from('profiles')
      .select('id, is_active, job_title, azure_user_id')
      .eq('email', email)
      .eq('company_id', company.id)
      .maybeSingle();
  }

  if (existingProfile.data) {
    // Update existing user - build update object with only non-blank values
    const updateData: any = {
      azure_user_id: azureUser.id,
      azure_principal_name: azureUser.userPrincipalName,
      azure_tenant_id: company.azure_tenant_id,
      last_azure_sync: new Date().toISOString(),
    };

    // Always update display name if provided
    if (azureUser.displayName) {
      updateData.full_name = azureUser.displayName;
    }

    // Only update phone if Microsoft has a value (don't blank it out)
    if (azureUser.mobilePhone) {
      updateData.phone = azureUser.mobilePhone;
    }

    // Only update job title if Microsoft has a value (don't blank it out)
    if (azureUser.jobTitle) {
      updateData.job_title = azureUser.jobTitle;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', existingProfile.data.id);

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }

    stats.usersUpdated++;
  } else if (company.azure_auto_create_users) {
    // Create new user
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: crypto.randomUUID(),
        email: email,
        full_name: azureUser.displayName,
        phone: azureUser.mobilePhone,
        job_title: azureUser.jobTitle,
        company_id: company.id,
        role: 'employee',
        azure_user_id: azureUser.id,
        azure_principal_name: azureUser.userPrincipalName,
        azure_tenant_id: company.azure_tenant_id,
        last_azure_sync: new Date().toISOString(),
        is_manual_creation: true,
        is_active: true,
        onboarding_completed: false,
      });

    if (insertError) {
      throw new Error(`Database error: ${insertError.message}`);
    }

    stats.usersCreated++;
  } else {
    stats.usersSkipped++;
  }
}

function categorizeError(err: any): string {
  const message = err.message || '';

  if (message.includes('Duplicate email') || message.includes('duplicate key')) {
    return 'duplicate_email';
  }
  if (message.includes('Missing email') || message.includes('Missing display name')) {
    return 'missing_data';
  }
  if (message.includes('Database error')) {
    return 'database_error';
  }
  if (message.includes('Failed to update')) {
    return 'update_failed';
  }

  return 'unknown';
}

interface SyncErrorLog {
  companyId: string;
  userPrincipalName: string | null;
  displayName: string | null;
  errorType: string;
  errorMessage: string;
  rawData: any;
}

async function logSyncError(supabase: any, errorLog: SyncErrorLog): Promise<void> {
  try {
    await supabase
      .from('azure_sync_errors')
      .insert({
        company_id: errorLog.companyId,
        user_principal_name: errorLog.userPrincipalName,
        display_name: errorLog.displayName,
        error_type: errorLog.errorType,
        error_message: errorLog.errorMessage,
        raw_data: errorLog.rawData,
        resolved: false,
      });
  } catch (logErr) {
    console.error('Failed to log sync error:', logErr);
  }
}