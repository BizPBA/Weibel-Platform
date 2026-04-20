import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AzureGroup {
  id: string;
  displayName: string;
  description: string | null;
  mail: string | null;
  memberCount?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

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

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Only admins can fetch Microsoft groups');
    }

    // Get company Azure config
    const { data: company } = await supabase
      .from('companies')
      .select('azure_tenant_id, azure_admin_consent_granted')
      .eq('id', profile.company_id)
      .single();

    if (!company || !company.azure_tenant_id) {
      throw new Error('Azure integration not configured');
    }

    if (!company.azure_admin_consent_granted) {
      throw new Error('Admin consent required. Please grant consent first.');
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

    // Fetch all groups from Microsoft Graph
    const groups = await fetchAllGroups(accessToken);

    // Fetch member count for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        try {
          const memberCount = await getGroupMemberCount(accessToken, group.id);
          return { ...group, memberCount };
        } catch (err) {
          console.error(`Failed to get member count for group ${group.id}:`, err);
          return { ...group, memberCount: 0 };
        }
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        groups: groupsWithCounts,
        total: groupsWithCounts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching Microsoft groups:', error);
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

async function fetchAllGroups(accessToken: string): Promise<AzureGroup[]> {
  const groups: AzureGroup[] = [];
  let nextLink: string | null = 'https://graph.microsoft.com/v1.0/groups?$select=id,displayName,description,mail&$top=999';

  while (nextLink) {
    const response = await fetch(nextLink, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch groups: ${error}`);
    }

    const data = await response.json();
    groups.push(...data.value);
    nextLink = data['@odata.nextLink'] || null;
  }

  return groups;
}

async function getGroupMemberCount(accessToken: string, groupId: string): Promise<number> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/groups/${groupId}/members/$count`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'ConsistencyLevel': 'eventual',
      },
    }
  );

  if (!response.ok) {
    return 0;
  }

  const count = await response.text();
  return parseInt(count, 10) || 0;
}