import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Building2, Check, AlertCircle, Loader2 } from 'lucide-react'
import { getRoleLabel } from '@/lib/permissions'
import { Database } from '@/lib/database.types'

type RoleType = Database['public']['Enums']['user_role']

interface InvitationData {
  id: string
  company_id: string
  email: string
  role: RoleType
  expires_at: string
  status: string
  company_name: string
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const inviteCode = searchParams.get('code')

  useEffect(() => {
    if (inviteCode) {
      validateInvitation()
    } else {
      setError('Ugyldig invitationslink')
      setLoading(false)
    }
  }, [inviteCode])

  const validateInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select(`
          id,
          company_id,
          email,
          role,
          expires_at,
          status,
          companies:company_id (
            name
          )
        `)
        .eq('invite_code', inviteCode)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        setError('Invitationen blev ikke fundet')
        return
      }

      if (data.status !== 'pending') {
        setError('Denne invitation er allerede blevet brugt')
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Denne invitation er udløbet')
        return
      }

      const companyName = (data.companies as any)?.name || 'Ukendt virksomhed'

      setInvitation({
        ...data,
        company_name: companyName,
      })
    } catch (err: any) {
      console.error('Validation error:', err)
      setError('Kunne ikke validere invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!user || !invitation) return

    setAccepting(true)
    setError(null)

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_id: invitation.company_id,
          role: invitation.role,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      const { error: inviteError } = await supabase
        .from('company_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: user.id,
        })
        .eq('id', invitation.id)

      if (inviteError) throw inviteError

      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    } catch (err: any) {
      console.error('Accept error:', err)
      setError(err.message || 'Kunne ikke acceptere invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Validerer invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ugyldig invitation</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/login')}>Gå til login</Button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Velkommen!</h2>
            <p className="text-slate-600 mb-2">Du er nu tilmeldt {invitation.company_name}</p>
            <p className="text-sm text-slate-500">Omdirigerer til dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Invitation til {invitation.company_name}</h2>
            <p className="text-slate-600 mb-6">
              Du skal være logget ind for at acceptere denne invitation
            </p>
            <Button onClick={() => navigate(`/login?invite=${inviteCode}`)} className="w-full">
              Log ind
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Inviteret til virksomhed</h2>
              <p className="text-slate-600 text-sm">Gennemgå detaljerne nedenfor</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <Label className="text-sm text-slate-600">Virksomhed</Label>
              <p className="text-lg font-semibold text-slate-900">{invitation.company_name}</p>
            </div>

            <div>
              <Label className="text-sm text-slate-600">Din rolle</Label>
              <p className="text-lg font-semibold text-slate-900">{getRoleLabel(invitation.role)}</p>
            </div>

            <div>
              <Label className="text-sm text-slate-600">Invitation sendt til</Label>
              <p className="text-slate-900">{invitation.email}</p>
            </div>

            <div>
              <Label className="text-sm text-slate-600">Udløber</Label>
              <p className="text-slate-900">
                {new Date(invitation.expires_at).toLocaleDateString('da-DK', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              Ved at acceptere denne invitation vil du tilmelde dig {invitation.company_name} og få adgang til deres data.
            </p>
          </div>

          <Button onClick={handleAccept} className="w-full" size="lg" disabled={accepting}>
            {accepting ? 'Accepterer...' : 'Accepter invitation'}
          </Button>
        </div>
      </div>
    </div>
  )
}
