'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
// import { PasskeyAuth } from '@/components/PasskeyAuth'
import { CompanyRegistration } from '@/components/CompanyRegistration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Mail, Lock, User, CircleAlert as AlertCircle, UserPlus, LogIn } from 'lucide-react'
import { generateCommonMicrosoftLoginUrl, generateState } from '@/lib/azureAd'

type AuthMode = 'signin' | 'signup' | 'company'
// type AuthMethod = 'password' | 'passkey'

export function LoginForm() {
  const navigate = useNavigate()
  const [authMode, setAuthMode] = useState<AuthMode>('signin')
  // const [authMethod, setAuthMethod] = useState<AuthMethod>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [microsoftEnabled, setMicrosoftEnabled] = useState(false)
  const [loadingMicrosoft, setLoadingMicrosoft] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setError('Din email er ikke bekræftet endnu. Tjek venligst din indbakke.')
          } else {
            throw error
          }
        }
      } else if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        if (error) {
          if (error.message.includes('rate') || error.status === 429) {
            const match = error.message.match(/(\d+)\s*seconds/)
            const retryAfter = match ? parseInt(match[1]) : 60
            navigate('/check-email', {
              state: {
                email: email,
                isRateLimited: true,
                retryAfter: retryAfter
              }
            })
            return
          }
          throw error
        }
        navigate('/check-email', {
          state: {
            email: email,
            isRateLimited: false
          }
        })
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // const handlePasskeySuccess = () => {
  //   setMessage('Successfully signed in with passkey!')
  //   setError('')
  // }

  // const handlePasskeyError = (errorMessage: string) => {
  //   setError(errorMessage)
  //   setMessage('')
  // }

  useEffect(() => {
    checkMicrosoftAvailability()
  }, [])

  const checkMicrosoftAvailability = async () => {
    try {
      const globalClientId = import.meta.env.VITE_MICROSOFT_CLIENTID || '5e1fc108-b19e-4a40-9cbf-f6b2e0169682';
      setMicrosoftEnabled(!!globalClientId)
    } catch (err) {
      console.error('Error checking Microsoft availability:', err)
    } finally {
      setLoadingMicrosoft(false)
    }
  }

  const handleMicrosoftLogin = async () => {
    try {
      setError('')

      const globalClientId = import.meta.env.VITE_MICROSOFT_CLIENTID || '5e1fc108-b19e-4a40-9cbf-f6b2e0169682';

      if (!globalClientId) {
        setError('Microsoft authentication is not configured. Please contact support.');
        return;
      }

      const redirectUri = `${window.location.origin}/auth/microsoft/callback`;
      const state = generateState();

      sessionStorage.setItem('microsoft_auth_state', state);
      sessionStorage.setItem('microsoft_auth_flow', 'common');

      const loginUrl = generateCommonMicrosoftLoginUrl(
        globalClientId,
        redirectUri,
        state
      );

      window.location.href = loginUrl;
    } catch (err: any) {
      console.error('Error initiating Microsoft login:', err);
      setError(err.message || 'Failed to initiate Microsoft login');
    }
  }

  const getCardTitle = () => {
    if (authMode === 'company') return 'Opret virksomhed'
    if (authMode === 'signup') return 'Opret personlig konto'
    return 'Log ind'
  }

  const getCardDescription = () => {
    if (authMode === 'company') return 'Start din virksomhed på InfoBridge'
    if (authMode === 'signup') return 'Opret en personlig konto for at deltage i et team'
    return 'Log ind på din konto sikkert'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">
            InfoBridge
          </CardTitle>
          <CardDescription className="text-base">
            {getCardDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authMode !== 'company' && (
            <div className="grid grid-cols-3 gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`py-2.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  authMode === 'signin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Log ind</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`py-2.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  authMode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Opret konto</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('company')}
                className={`py-2.5 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  authMode === 'company'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Virksomhed</span>
              </button>
            </div>
          )}

          {authMode === 'company' ? (
            <div>
              <CompanyRegistration />
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Har du allerede en konto? Log ind
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Passkey tabs disabled until feature is reactivated */}
              <div className="w-full">
                <div className="mt-2">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {authMode === 'signup' && (
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Fulde navn</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="Indtast dit fulde navn"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Indtast din email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Adgangskode</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Indtast din adgangskode"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? 'Indlæser...' : authMode === 'signin' ? 'Log ind' : 'Opret konto'}
                    </Button>
                  </form>

                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">Eller fortsæt med</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4 bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white border-none"
                      disabled={!microsoftEnabled || loadingMicrosoft}
                      onClick={handleMicrosoftLogin}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                        <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                        <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                        <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                      </svg>
                      {loadingMicrosoft ? 'Indlæser...' : 'Log ind med Microsoft'}
                    </Button>
                    {!loadingMicrosoft && !microsoftEnabled && (
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Microsoft login er ikke konfigureret endnu
                      </p>
                    )}
                  </div>
                </div>
                {/*
                <TabsContent value="passkey" className="mt-6">
                  <div className="text-center py-8">
                    <Fingerprint className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Passkey funktionalitet kommer snart</p>
                  </div>
                </TabsContent>
                */}
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm mt-4 bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {message && (
                <div className="text-green-600 text-sm text-center mt-4 bg-green-50 p-3 rounded-lg border border-green-200">
                  {message}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}