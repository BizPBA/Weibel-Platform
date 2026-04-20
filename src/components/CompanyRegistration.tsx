'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Mail, Lock, User, Phone, CircleAlert as AlertCircle } from 'lucide-react'

export function CompanyRegistration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [error, setError] = useState('')
  const [existingCompany, setExistingCompany] = useState<{name: string, emailConfirmed: boolean} | null>(null)

  const [formData, setFormData] = useState({
    companyName: '',
    companyDescription: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })

  useEffect(() => {
    checkExistingRegistration()
  }, [])

  const checkExistingRegistration = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id, full_name')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profile?.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('name')
            .eq('id', profile.company_id)
            .maybeSingle()

          if (company) {
            const emailConfirmed = session.user.email_confirmed_at !== null
            setExistingCompany({ name: company.name, emailConfirmed })

            if (emailConfirmed) {
              navigate('/dashboard')
              return
            } else {
              navigate('/check-email', {
                state: {
                  email: session.user.email,
                  companyName: company.name,
                  isRateLimited: false
                }
              })
              return
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking existing registration:', error)
    } finally {
      setCheckingExisting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = (): boolean => {
    if (!formData.companyName.trim()) {
      setError('Virksomhedsnavn er påkrævet')
      return false
    }

    if (!formData.fullName.trim()) {
      setError('Fulde navn er påkrævet')
      return false
    }

    if (!formData.email.trim()) {
      setError('Email er påkrævet')
      return false
    }

    if (!formData.password) {
      setError('Adgangskode er påkrævet')
      return false
    }

    if (formData.password.length < 6) {
      setError('Adgangskode skal være mindst 6 tegn')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Adgangskoder matcher ikke')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      console.log('Starting signup process...')
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      })

      if (signUpError) {
        console.error('Signup error details:', {
          message: signUpError.message,
          status: signUpError.status,
          code: (signUpError as any).code,
          details: (signUpError as any).details,
          hint: (signUpError as any).hint,
          fullError: signUpError
        })

        if (signUpError.message.includes('rate_limit') || signUpError.message.includes('rate limit') || signUpError.status === 429) {
          const match = signUpError.message.match(/(\d+)\s*seconds/)
          const retryAfter = match ? parseInt(match[1]) : 60

          navigate('/check-email', {
            state: {
              email: formData.email,
              companyName: formData.companyName,
              isRateLimited: true,
              retryAfter: retryAfter
            }
          })
          return
        }
        throw signUpError
      }

      if (!authData.user) {
        throw new Error('Bruger blev ikke oprettet')
      }

      console.log('User created:', authData.user.id)
      console.log('Session exists:', !!authData.session)

      if (!authData.session) {
        console.warn('No session after signup - email confirmation required')
      }

      console.log('Creating company via Edge Function with name:', formData.companyName)

      // Call the Edge Function to create company (bypasses RLS)
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-company`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          userId: authData.user.id,
          companyName: formData.companyName,
          companyDescription: formData.companyDescription || undefined,
          fullName: formData.fullName,
          phone: formData.phone || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Company creation failed:', errorData)
        throw new Error(errorData.error || 'Failed to create company')
      }

      const { company } = await response.json()
      console.log('Company created successfully:', company)

      navigate('/check-email', {
        state: {
          email: formData.email,
          companyName: company.name,
          isRateLimited: false
        }
      })
    } catch (error: any) {
      console.error('Company registration error:', error)

      let userFriendlyMessage = 'Noget gik galt. Prøv venligst igen.'

      if (error.message) {
        if (error.message.includes('Database error')) {
          userFriendlyMessage = 'Der opstod en databasefejl. Kontakt venligst support hvis problemet fortsætter.'
        } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
          userFriendlyMessage = 'Denne email er allerede registreret. Prøv at logge ind i stedet.'
        } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
          userFriendlyMessage = 'Ugyldige data. Kontroller venligst dine oplysninger og prøv igen.'
        } else {
          userFriendlyMessage = error.message
        }
      }

      setError(userFriendlyMessage)
    } finally {
      setLoading(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Kontrollerer eksisterende registrering...</p>
        </div>
      </div>
    )
  }

  if (existingCompany) {
    return (
      <div className="text-center py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Virksomhed allerede oprettet</h3>
          <p className="text-sm text-blue-700 mb-1">
            Du har allerede oprettet virksomheden <span className="font-semibold">{existingCompany.name}</span>
          </p>
          {!existingCompany.emailConfirmed && (
            <p className="text-sm text-blue-700">
              Tjek venligst din email for at bekræfte din konto.
            </p>
          )}
        </div>
        <Button onClick={() => navigate('/login')} className="w-full max-w-xs">
          Gå til login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">Opret virksomhedskonto</p>
            <p className="text-xs text-blue-700 mt-1">
              Du vil blive oprettet som administrator med fuld adgang til alle funktioner
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-b pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Virksomhedsoplysninger</h3>

          <div className="space-y-3">
            <div>
              <Label htmlFor="companyName">
                Virksomhedsnavn <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="f.eks. Din Virksomhed ApS"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="companyDescription">Beskrivelse (valgfri)</Label>
              <Textarea
                id="companyDescription"
                name="companyDescription"
                placeholder="Kort beskrivelse af din virksomhed"
                value={formData.companyDescription}
                onChange={handleChange}
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="border-b pb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Administrator oplysninger</h3>

          <div className="space-y-3">
            <div>
              <Label htmlFor="fullName">
                Fulde navn <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="f.eks. Hans Hansen"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="din@email.dk"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefonnummer (valgfri)</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+45 12 34 56 78"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sikkerhed</h3>

          <div className="space-y-3">
            <div>
              <Label htmlFor="password">
                Adgangskode <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mindst 6 tegn"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">
                Bekræft adgangskode <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Gentag adgangskode"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Opretter virksomhed...' : 'Opret virksomhedskonto'}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Ved at oprette en konto accepterer du vores vilkår og betingelser
      </p>
    </form>
  )
}
