import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Building2, Users, AlertCircle } from 'lucide-react'

export default function MigrationWizard() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [loading, setLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [joinCode, setJoinCode] = useState('')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    const checkExistingCompany = async () => {
      console.log('MigrationWizard: Checking existing company for user:', user?.id)
      console.log('MigrationWizard: Current profile:', profile)

      if (!user) {
        console.log('MigrationWizard: No user, ending check')
        setCheckingExisting(false)
        return
      }

      if (profile && profile.company_id) {
        console.log('MigrationWizard: Profile has company_id from context, redirecting immediately:', profile.company_id)
        window.location.href = '/dashboard'
        return
      }

      try {
        console.log('MigrationWizard: Fetching fresh profile data from database')
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id, onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.error('MigrationWizard: Error checking profile:', profileError)
          setCheckingExisting(false)
          return
        }

        console.log('MigrationWizard: Fresh profile data:', profileData)

        if (profileData?.company_id) {
          console.log('MigrationWizard: User has company_id in database, redirecting to dashboard')
          window.location.href = '/dashboard'
          return
        }

        console.log('MigrationWizard: User does not have a company, showing wizard')
      } catch (error) {
        console.error('MigrationWizard: Error checking existing company:', error)
      } finally {
        setCheckingExisting(false)
      }
    }

    checkExistingCompany()
  }, [user, profile, navigate])

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error('Ikke autentificeret')

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({ name: companyName })
        .select()
        .single()

      if (companyError) {
        // Check if it's a duplicate company name error
        if (companyError.code === '23505') {
          throw new Error('En virksomhed med dette navn eksisterer allerede. Vælg venligst et andet navn.')
        }
        throw companyError
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_id: company.id,
          role: 'admin',
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Migration error:', err)
      // Show user-friendly error messages
      if (err.message.includes('policy')) {
        setError('Der opstod et tilladelsesproblem. Kontakt venligst support.')
      } else {
        setError(err.message || 'Noget gik galt. Prøv venligst igen.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleJoinCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error('Ikke autentificeret')

      const { data: codeData, error: validateError } = await supabase.rpc('validate_join_code', {
        code_input: joinCode.toUpperCase(),
      })

      if (validateError) throw validateError
      if (!codeData || codeData.length === 0) {
        throw new Error('Ugyldig eller udløbet kode')
      }

      const codeInfo = codeData[0]
      if (!codeInfo.is_valid) {
        throw new Error('Koden er ikke længere gyldig')
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_id: codeInfo.company_id,
          role: codeInfo.role,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      const { error: incrementError } = await supabase.rpc('increment_join_code_usage', {
        code_input: joinCode.toUpperCase(),
      })

      if (incrementError) console.error('Failed to increment usage:', incrementError)

      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Join error:', err)
      setError(err.message || 'Noget gik galt. Prøv venligst igen.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-slate-600">Kontrollerer din konto...</p>
        </div>
      </div>
    )
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Velkommen tilbage!</h1>
            <p className="text-slate-600">Lad os konfigurere din konto</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setMode('create')}
              className="bg-white rounded-xl shadow-lg border-2 border-slate-200 hover:border-blue-500 p-8 text-left transition-all group"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Building2 className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Opret ny virksomhed</h3>
              <p className="text-slate-600 mb-4">
                Start din egen virksomhed og inviter teammedlemmer
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Du bliver administrator</li>
                <li>• Fuld kontrol over indstillinger</li>
                <li>• Inviter ubegrænsede brugere</li>
              </ul>
            </button>

            <button
              onClick={() => setMode('join')}
              className="bg-white rounded-xl shadow-lg border-2 border-slate-200 hover:border-green-500 p-8 text-left transition-all group"
            >
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                <Users className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Tilmeld dig en virksomhed</h3>
              <p className="text-slate-600 mb-4">
                Har du modtaget en invitationskode? Tilmeld dig her
              </p>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>• Brug din invitationskode</li>
                <li>• Øjeblikkelig adgang</li>
                <li>• Tildelt rolle af administrator</li>
              </ul>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            <button
              onClick={() => setMode('select')}
              className="text-sm text-slate-600 hover:text-slate-900 mb-6"
            >
              ← Tilbage
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Opret virksomhed</h2>
                <p className="text-slate-600">Angiv dit virksomhedsnavn</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <Label htmlFor="companyName">
                  Virksomhedsnavn <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="f.eks. Din Virksomhed ApS"
                  className="mt-1.5"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">Administrator rolle</p>
                <p className="text-sm text-blue-700 mt-1">
                  Du vil blive oprettet som administrator med fuld adgang.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Opretter...' : 'Opret virksomhed'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          <button
            onClick={() => setMode('select')}
            className="text-sm text-slate-600 hover:text-slate-900 mb-6"
          >
            ← Tilbage
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Tilmeld dig virksomhed</h2>
              <p className="text-slate-600">Indtast din invitationskode</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleJoinCompany} className="space-y-4">
            <div>
              <Label htmlFor="joinCode">
                Invitationskode <span className="text-red-500">*</span>
              </Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="f.eks. ABC12345"
                className="mt-1.5 font-mono text-lg"
                maxLength={8}
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Koden blev sendt til dig af din administrator
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Tilmelder...' : 'Tilmeld virksomhed'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
