import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
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

    // Get the URL path to determine the action
    const url = new URL(req.url)
    const path = url.pathname

    if (path.endsWith('/login-options')) {
      // Generate authentication options
      const { email } = await req.json()

      if (!email) {
        throw new Error('Email is required for authentication')
      }

      // Get user by email
      const { data: existingUser } = await supabaseClient
        .rpc('get_user_by_email', { user_email: email })

      if (!existingUser || existingUser.length === 0) {
        throw new Error('User not found')
      }

      const userId = existingUser[0].id

      // Get user's passkeys
      const { data: userPasskeys, error: passkeysError } = await supabaseClient
        .from('passkeys')
        .select('credential_id')
        .eq('user_id', userId)

      if (passkeysError || !userPasskeys || userPasskeys.length === 0) {
        throw new Error('No passkeys found for this user')
      }

      const allowCredentials = userPasskeys.map(passkey => ({
        id: passkey.credential_id,
        type: 'public-key' as const,
        transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      }))

      const options = await generateAuthenticationOptions({
        rpID: 'localhost', // Change this to your domain in production
        allowCredentials,
        userVerification: 'preferred',
      })

      // Store the challenge in the database
      await supabaseClient
        .from('passkey_challenges')
        .insert({
          user_id: userId,
          challenge: options.challenge,
          type: 'authentication',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        })

      return new Response(JSON.stringify({ 
        options,
        userId: userId 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else if (path.endsWith('/login-verify')) {
      // Verify authentication response
      const { credential, email } = await req.json()

      if (!credential || !email) {
        throw new Error('Missing required fields for verification')
      }

      // Get user
      const { data: existingUser } = await supabaseClient
        .rpc('get_user_by_email', { user_email: email })

      if (!existingUser || existingUser.length === 0) {
        throw new Error('User not found')
      }

      const userId = existingUser[0].id

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
        .eq('type', 'authentication')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (challengeError || !challengeRecord) {
        throw new Error('Invalid or expired challenge')
      }

      // Get the passkey from the database
      const credentialId = credential.id || credential.rawId
      const { data: passkey, error: passkeyError } = await supabaseClient
        .from('passkeys')
        .select('*')
        .eq('user_id', userId)
        .eq('credential_id', credentialId)
        .single()

      if (passkeyError || !passkey) {
        throw new Error('Passkey not found')
      }

      // Verify the authentication response
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: 'http://localhost:3000', // Change this to your domain in production
        expectedRPID: 'localhost', // Change this to your domain in production
        authenticator: {
          credentialID: Buffer.from(passkey.credential_id, 'base64'),
          credentialPublicKey: Buffer.from(passkey.public_key, 'base64'),
          counter: passkey.counter,
        },
      })

      if (!verification.verified) {
        throw new Error('Authentication verification failed')
      }

      // Update the counter
      await supabaseClient
        .from('passkeys')
        .update({ 
          counter: verification.authenticationInfo.newCounter,
          last_used_at: new Date().toISOString()
        })
        .eq('id', passkey.id)

      // Clean up the challenge
      await supabaseClient
        .from('passkey_challenges')
        .delete()
        .eq('id', challengeRecord.id)

      // Create a session for the user
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      })

      if (sessionError || !sessionData) {
        throw new Error('Failed to create session')
      }

      // Extract the session from the magic link
      const url = new URL(sessionData.properties.action_link)
      const accessToken = url.searchParams.get('access_token')
      const refreshToken = url.searchParams.get('refresh_token')

      if (!accessToken || !refreshToken) {
        throw new Error('Failed to extract session tokens')
      }

      return new Response(JSON.stringify({ 
        verified: true,
        session: {
          access_token: accessToken,
          refresh_token: refreshToken,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid endpoint')

  } catch (error: any) {
    console.error('Error in authenticate-passkey function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})