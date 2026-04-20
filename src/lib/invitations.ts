import { supabase } from './supabase'

interface SendInvitationEmailParams {
  email: string
  companyName: string
  companyLogo?: string | null
  role: string
  inviteCode: string
  inviterName: string
  expiresAt: string
}

export async function sendInvitationEmail(params: SendInvitationEmailParams): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invitation-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: params.email,
          companyName: params.companyName,
          companyLogo: params.companyLogo,
          role: params.role,
          inviteCode: params.inviteCode,
          inviterName: params.inviterName,
          expiresAt: params.expiresAt,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Kunne ikke sende email',
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error sending invitation email:', error)
    return {
      success: false,
      error: error.message || 'Kunne ikke sende email',
    }
  }
}

export async function resendInvitationEmail(invitationId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { data: invitation, error: fetchError } = await supabase
      .from('company_invitations')
      .select('*, companies!inner(name, logo_url), profiles!company_invitations_created_by_fkey(full_name, email)')
      .eq('id', invitationId)
      .maybeSingle()

    if (fetchError || !invitation) {
      return {
        success: false,
        error: 'Kunne ikke finde invitationen',
      }
    }

    const company = invitation.companies as any
    const creator = invitation.profiles as any

    return await sendInvitationEmail({
      email: invitation.email,
      companyName: company.name,
      companyLogo: company.logo_url,
      role: invitation.role,
      inviteCode: invitation.invite_code,
      inviterName: creator?.full_name || creator?.email || 'En kollega',
      expiresAt: invitation.expires_at,
    })
  } catch (error: any) {
    console.error('Error resending invitation:', error)
    return {
      success: false,
      error: error.message || 'Kunne ikke sende email',
    }
  }
}

interface SendWelcomeEmailParams {
  email: string
  fullName: string
  companyName: string
  companyLogo?: string | null
  role: string
  adminName: string
  adminEmail: string
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: params.email,
          fullName: params.fullName,
          companyName: params.companyName,
          companyLogo: params.companyLogo,
          role: params.role,
          adminName: params.adminName,
          adminEmail: params.adminEmail,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Kunne ikke sende velkomst-email',
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error sending welcome email:', error)
    return {
      success: false,
      error: error.message || 'Kunne ikke sende velkomst-email',
    }
  }
}
