import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { OnboardingLayout } from '@/components/OnboardingLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Building2, Users, CheckCircle } from 'lucide-react'

const STEPS = [
  { number: 1, title: 'Færdig', description: 'Kom i gang' },
]

export default function CompanyOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, profile, company } = useAuth()
  const navigate = useNavigate()
  const [companyAlreadyCreated, setCompanyAlreadyCreated] = useState(false)

  useEffect(() => {
    if (profile && company) {
      setCompanyAlreadyCreated(true)
      setLoading(false)
      setCurrentStep(1)
    } else if (profile && !company) {
      navigate('/login')
    }
  }, [profile, company, navigate])

  const handleComplete = () => {
    window.location.href = '/dashboard'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Indlæser...</p>
        </div>
      </div>
    )
  }

  if (!companyAlreadyCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Omdirigerer...</p>
        </div>
      </div>
    )
  }

  return (
    <OnboardingLayout currentStep={currentStep} steps={STEPS}>
      {currentStep === 1 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-3">Velkommen til InfoBridge!</h2>
          <p className="text-lg text-slate-600 mb-2">Din virksomhed {company?.name} er oprettet</p>
          <p className="text-slate-500 mb-8">Du er nu klar til at komme i gang</p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-slate-900 mb-4">Næste skridt:</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Tilføj kunder og lokationer</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Inviter teammedlemmer til din virksomhed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Tildel lokationer til medarbejdere</span>
              </li>
            </ul>
          </div>

          <Button size="lg" onClick={handleComplete} className="w-full max-w-xs">
            Gå til Dashboard
          </Button>
        </div>
      )}
    </OnboardingLayout>
  )
}
