import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { getRoleLabel, getRoleColor } from '@/lib/permissions'
import { Database } from '@/lib/database.types'
import {
  Building2,
  Users,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Mail,
  Plus,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'

type UserRole = Database['public']['Enums']['user_role']

interface JoinCode {
  id: string
  code: string
  role: string
  max_uses: number | null
  current_uses: number
  expires_at: string
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
  created_at: string
}

export function CompanySettings() {
  const { profile, company, isAdmin } = useAuth()
  const [joinCodes, setJoinCodes] = useState<JoinCode[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee')
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo_url || null)

  useEffect(() => {
    if (isAdmin && profile?.company_id) {
      fetchJoinCodes()
      fetchInvitations()
    }
  }, [isAdmin, profile?.company_id])

  useEffect(() => {
    if (company?.logo_url) {
      setLogoPreview(company.logo_url)
    }
  }, [company?.logo_url])

  const fetchJoinCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('company_join_codes')
        .select('*')
        .eq('company_id', profile!.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJoinCodes(data || [])
    } catch (err: any) {
      console.error('Error fetching join codes:', err)
    }
  }

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', profile!.company_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setInvitations(data || [])
    } catch (err: any) {
      console.error('Error fetching invitations:', err)
    }
  }

  const generateJoinCode = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { data, error } = await supabase.rpc('generate_invite_code', { length: 8 })
      if (error) throw error

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const { error: insertError } = await supabase
        .from('company_join_codes')
        .insert({
          company_id: profile!.company_id,
          code: data,
          role: selectedRole,
          max_uses: null,
          expires_at: expiresAt.toISOString(),
          is_active: true
        })

      if (insertError) throw insertError

      setMessage(`Ny tilmeldingskode genereret for rolle: ${getRoleLabel(selectedRole)}!`)
      setIsGenerateDialogOpen(false)
      setSelectedRole('employee')
      await fetchJoinCodes()
    } catch (err: any) {
      console.error('Error generating join code:', err)
      setError(err.message || 'Kunne ikke generere kode')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const deactivateCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('company_join_codes')
        .update({ is_active: false })
        .eq('id', codeId)

      if (error) throw error

      setMessage('Kode deaktiveret')
      await fetchJoinCodes()
    } catch (err: any) {
      console.error('Error deactivating code:', err)
      setError(err.message || 'Kunne ikke deaktivere kode')
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('company_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)

      if (error) throw error

      setMessage('Invitation annulleret')
      await fetchInvitations()
    } catch (err: any) {
      console.error('Error cancelling invitation:', err)
      setError(err.message || 'Kunne ikke annullere invitation')
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !company) return

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Filen er for stor. Maksimal størrelse er 2MB.')
      return
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Ugyldig filtype. Tilladt: PNG, JPG, SVG, WEBP')
      return
    }

    setUploadingLogo(true)
    setError('')
    setMessage('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${company.id}/logo.${fileExt}`

      if (company.logo_url) {
        const oldFileName = company.logo_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('company-logos')
            .remove([`${company.id}/${oldFileName}`])
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName)

      const logoUrl = publicUrlData.publicUrl

      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: logoUrl })
        .eq('id', company.id)

      if (updateError) throw updateError

      setLogoPreview(logoUrl)
      setMessage('Logo uploadet succesfuldt!')
    } catch (err: any) {
      console.error('Error uploading logo:', err)
      setError(err.message || 'Kunne ikke uploade logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!company?.logo_url) return

    setUploadingLogo(true)
    setError('')
    setMessage('')

    try {
      const fileName = company.logo_url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('company-logos')
          .remove([`${company.id}/${fileName}`])
      }

      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: null })
        .eq('id', company.id)

      if (updateError) throw updateError

      setLogoPreview(null)
      setMessage('Logo fjernet succesfuldt!')
    } catch (err: any) {
      console.error('Error removing logo:', err)
      setError(err.message || 'Kunne ikke fjerne logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Virksomhedsindstillinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Kun administratorer kan administrere virksomhedsindstillinger.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Virksomhedsoplysninger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Virksomhedslogo</Label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative group">
                    <div className="w-32 h-32 border-2 border-slate-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={logoPreview}
                        alt="Company logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      onClick={handleRemoveLogo}
                      disabled={uploadingLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-600">
                  Upload et logo til din virksomhed. Dette vil blive vist i email invitationer.
                </p>
                <div className="flex gap-2">
                  <label htmlFor="logo-upload">
                    <Button
                      type="button"
                      size="sm"
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingLogo ? 'Uploader...' : logoPreview ? 'Skift logo' : 'Upload logo'}
                    </Button>
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  PNG, JPG, SVG eller WEBP. Maks 2MB.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Virksomhedsnavn</Label>
            <Input value={company?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>Virksomheds-ID</Label>
            <Input value={company?.id || ''} disabled className="font-mono text-sm" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tilmeldingskoder
            </CardTitle>
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Generer ny kode
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generer tilmeldingskode</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rolle for nye medlemmer</Label>
                    <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">
                          <span className="flex items-center gap-2">
                            {getRoleLabel('employee')}
                          </span>
                        </SelectItem>
                        <SelectItem value="location_responsible">
                          <span className="flex items-center gap-2">
                            {getRoleLabel('location_responsible')}
                          </span>
                        </SelectItem>
                        <SelectItem value="customer_responsible">
                          <span className="flex items-center gap-2">
                            {getRoleLabel('customer_responsible')}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      Koden vil være gyldig i 30 dage og kan bruges ubegrænset.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                    Annuller
                  </Button>
                  <Button onClick={generateJoinCode} disabled={loading}>
                    {loading ? 'Genererer...' : 'Generer kode'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-sm text-gray-600">
            Del disse koder med nye medarbejdere, så de kan tilmelde sig virksomheden.
          </p>

          {joinCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Ingen aktive tilmeldingskoder. Generer en for at komme i gang.
            </div>
          ) : (
            <div className="space-y-3">
              {joinCodes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <code className="text-lg font-bold text-blue-600">{code.code}</code>
                      <Badge className={getRoleColor(code.role as UserRole)}>
                        {getRoleLabel(code.role as UserRole)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Udløber {new Date(code.expires_at).toLocaleDateString('da-DK')}
                      </span>
                      {code.max_uses && (
                        <span>
                          Anvendt {code.current_uses} / {code.max_uses}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(code.code)}
                    >
                      {copiedCode === code.code ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                          Kopieret
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Kopier
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deactivateCode(code.id)}
                    >
                      Deaktiver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Afventende invitationer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Email invitationer sendt til nye teammedlemmer.
          </p>

          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Ingen afventende invitationer.
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{invitation.email}</span>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Sendt {new Date(invitation.created_at).toLocaleDateString('da-DK')} •
                      Udløber {new Date(invitation.expires_at).toLocaleDateString('da-DK')}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelInvitation(invitation.id)}
                  >
                    Annuller
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
