import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from 'https://esm.sh/@simplewebauthn/server@8.3.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get the URL path to determine the action
    const url = new URL(req.url)
    const path = url.pathname

    if (path.endsWith('/register-options')) {
      // Generate registration options
      const { email, displayName } = await req.json()

      if (!email || !displayName) {
        throw new Error('Email and displayName are required for registration')
      }

      // Check if user exists
      const { data: existingUser } = await supabaseClient
        .rpc('get_user_by_email', { user_email: email })

      if (!existingUser || existingUser.length === 0) {
        throw new Error('User not found')
      }

      const userId = existingUser[0].id

      // Get existing passkeys for this user
      const { data: existingPasskeys } = await supabaseClient
        .from('passkeys')
        .select('credential_id')
        .eq('user_id', userId) // UUID from user lookup

      const excludeCredentials = existingPasskeys?.map(passkey => ({
        id: passkey.credential_id,
        type: 'public-key' as const,
        transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      })) || []

      const options = await generateRegistrationOptions({
        rpName: 'InfoBridge',
        rpID: 'localhost', // Change this to your domain in production
        userID: userId,
        userName: email,
        userDisplayName: displayName,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
      })

      // Store the challenge in the database
      await supabaseClient
        .from('passkey_challenges')
        .insert({
          user_id: userId, // UUID from request body
          challenge: options.challenge,
          type: 'registration',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        })

      return new Response(JSON.stringify(options), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (path.endsWith('/register-verify')) {
      // Verify registration response
      const { credential, userId } = await req.json()

      if (!credential || !userId) {
        return new Response(
          JSON.stringify({ error: 'Credential and userId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user by ID
      const { data: existingUser } = await supabaseClient
        .rpc('get_user_by_email_and_id', { user_id: userId })

      if (!existingUser || existingUser.length === 0) {
        throw new Error('User not found')
      }

      const userEmail = existingUser[0].email

      // Get the challenge from the credential response
      const challenge = credential.response?.clientDataJSON ? 
        JSON.parse(atob(credential.response.clientDataJSON)).challenge : null

      if (!challenge) {
        throw new Error('No challenge found in credential')
      }

      // Verify the challenge exists and is valid
      const { data: challengeRecord, error: challengeError } = await supabaseClient
        .from('passkey_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge', challenge)
        .eq('type', 'registration')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (challengeError || !challengeRecord) {
        throw new Error('Invalid or expired challenge')
      }

      // Verify the registration response
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: 'http://localhost:3000', // Change this to your domain in production
        expectedRPID: 'localhost', // Change this to your domain in production
      })

      if (!verification.verified || !verification.registrationInfo) {
        throw new Error('Registration verification failed')
      }

      // Store the passkey in the database
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

      await supabaseClient
        .from('passkeys')
        .insert({
          user_id: userId,
          credential_id: Buffer.from(credentialID).toString('base64'),
          public_key: Buffer.from(credentialPublicKey).toString('base64'),
          counter: counter,
          display_name: existingUser[0].full_name || 'User',
          email: userEmail,
        })

      // Clean up the challenge
      await supabaseClient
        .from('passkey_challenges')
        .delete()
        .eq('id', challengeRecord.id)

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid endpoint')

  } catch (error: any) {
    console.error('Error in register-passkey function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})