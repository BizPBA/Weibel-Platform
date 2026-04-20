import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { sendInvitationEmail } from '@/lib/invitations'
import { useAuth } from '@/components/AuthProvider'
import { Mail, Check, AlertCircle, AlertTriangle } from 'lucide-react'
import { Database } from '@/lib/database.types'

type RoleType = Database['public']['Enums']['user_role']

interface InviteTeamMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InviteTeamMemberModal({ open, onOpenChange, onSuccess }: InviteTeamMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RoleType>('employee')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { user, company, profile } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setEmailWarning(null)
    setSuccess(false)

    try {
      if (!user || !company || !profile) throw new Error('Ikke autentificeret')

      const inviteCode = await generateInviteCode()

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error: inviteError } = await supabase
        .from('company_invitations')
        .insert({
          company_id: company.id,
          email: email.toLowerCase(),
          role,
          invite_code: inviteCode,
          invite_type: 'email',
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
          status: 'pending',
        })

      if (inviteError) throw inviteError

      const emailResult = await sendInvitationEmail({
        email: email.toLowerCase(),
        companyName: company.name,
        companyLogo: company.logo_url,
        role,
        inviteCode,
        inviterName: profile.full_name || user.email || 'En kollega',
        expiresAt: expiresAt.toISOString(),
      })

      if (!emailResult.success) {
        console.error('Email sending failed:', emailResult.error)
        setEmailWarning(
          'Invitationen er oprettet, men emailen kunne ikke sendes. Du kan sende den igen fra Team-siden.'
        )
      }

      setSuccess(true)
      setTimeout(() => {
        setEmail('')
        setRole('employee')
        setSuccess(false)
        setEmailWarning(null)
        onOpenChange(false)
        onSuccess?.()
      }, emailWarning ? 4000 : 2000)
    } catch (err: any) {
      console.error('Invite error:', err)
      setError(err.message || 'Kunne ikke sende invitation')
    } finally {
      setLoading(false)
    }
  }

  const generateInviteCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_invite_code', { length: 8 })
    if (error) throw error
    return data
  }

  const handleClose = () => {
    if (!loading) {
      setEmail('')
      setRole('employee')
      setError(null)
      setEmailWarning(null)
      setSuccess(false)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Inviter teammedlem
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Invitation sendt!</h3>
            <p className="text-sm text-slate-600">
              Invitationen er blevet sendt til {email}
            </p>
            {emailWarning && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2 text-left">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{emailWarning}</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kollega@firma.dk"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">
                Rolle <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={(value) => setRole(value as RoleType)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="customer_responsible">Kunde ansvarlig</SelectItem>
                  <SelectItem value="location_responsible">Lokation ansvarlig</SelectItem>
                  <SelectItem value="employee">Medarbejder</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-2">
                {role === 'admin' && 'Fuld adgang til alle funktioner'}
                {role === 'customer_responsible' && 'Kan administrere kunder og lokationer'}
                {role === 'location_responsible' && 'Kan administrere lokationer'}
                {role === 'employee' && 'Kan kun se tildelte lokationer'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                Invitationen udløber efter 7 dage. Du kan sende en ny invitation hvis nødvendigt.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                Annuller
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Sender...' : 'Send invitation'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
