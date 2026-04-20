import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RegistrationRequest {
  userId: string;
  companyName: string;
  companyDescription?: string;
  fullName: string;
  phone?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, companyName, companyDescription, fullName, phone }: RegistrationRequest = await req.json();

    // Validate input
    if (!userId || !companyName || !fullName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, companyName, fullName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a company
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile?.company_id) {
      return new Response(
        JSON.stringify({ error: 'User already has a company' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        description: companyDescription || null,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Company creation failed:', companyError);
      return new Response(
        JSON.stringify({ error: 'Failed to create company', details: companyError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the user's profile
    const { error: profileError } = await supabase.rpc(
      'complete_company_registration',
      {
        user_id_param: userId,
        company_id_param: company.id,
        full_name_param: fullName,
        phone_param: phone || null,
        role_param: 'admin'
      }
    );

    if (profileError) {
      console.error('Profile update failed:', profileError);
      // Try to cleanup the company if profile update fails
      await supabase.from('companies').delete().eq('id', company.id);

      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the activity
    await supabase
      .from('company_audit_log')
      .insert({
        company_id: company.id,
        user_id: userId,
        action: 'company_created',
        entity_type: 'company',
        entity_id: company.id,
        new_values: { name: company.name },
      });

    return new Response(
      JSON.stringify({
        success: true,
        company: {
          id: company.id,
          name: company.name,
          description: company.description,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in register-company function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
