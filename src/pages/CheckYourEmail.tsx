'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Mail, CheckCircle, AlertCircle, Clock, ArrowLeft } from 'lucide-react'

export default function CheckYourEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const email = location.state?.email || ''
  const companyName = location.state?.companyName || ''
  const isRateLimited = location.state?.isRateLimited || false
  const retryAfter = location.state?.retryAfter || 0

  useEffect(() => {
    if (retryAfter > 0) {
      setCountdown(retryAfter)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [retryAfter])

  const handleResendEmail = async () => {
    if (!email) {
      setResendError('Email adresse mangler')
      return
    }

    setResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        if (error.message.includes('rate')) {
          const match = error.message.match(/after (\d+) seconds/)
          const seconds = match ? parseInt(match[1]) : 60
          setCountdown(seconds)
          setResendError(`Vent venligst ${seconds} sekunder før du prøver igen`)
        } else {
          throw error
        }
      } else {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 5000)
      }
    } catch (error: any) {
      console.error('Resend error:', error)
      setResendError(error.message || 'Kunne ikke sende email. Prøv igen senere.')
    } finally {
      setResending(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {isRateLimited ? 'Registrering under behandling' : 'Bekræft din email'}
          </CardTitle>
          <CardDescription>
            InfoBridge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isRateLimited && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Din registrering er sandsynligvis gennemført</p>
                  <p className="text-blue-700">
                    På grund af sikkerhedsbegrænsninger kan vi ikke sende flere emails lige nu,
                    men din konto er muligvis allerede oprettet.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="w-16 h-16 text-blue-600" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Tjek din indbakke
            </h3>

            {email && (
              <p className="text-sm text-slate-600 mb-4">
                Vi har sendt en bekræftelsesmail til:
                <br />
                <span className="font-medium text-slate-900">{email}</span>
              </p>
            )}

            {companyName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-left">
                    <p className="font-medium text-green-900 mb-1">Virksomhed oprettet</p>
                    <p className="text-green-700">
                      <span className="font-medium">{companyName}</span> er blevet oprettet og venter på din emailbekræftelse.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-slate-900 mb-2">Næste trin:</p>
              <ol className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-900">1.</span>
                  <span>Åbn emailen fra InfoBridge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-900">2.</span>
                  <span>Klik på bekræftelseslinket</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-slate-900">3.</span>
                  <span>Log ind på din konto</span>
                </li>
              </ol>
            </div>
          </div>

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Email sendt! Tjek din indbakke.</span>
            </div>
          )}

          {resendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{resendError}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full"
              disabled={resending || countdown > 0}
            >
              {resending ? 'Sender...' : countdown > 0 ? `Vent ${countdown}s` : 'Send email igen'}
            </Button>

            <Button
              onClick={handleBackToLogin}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbage til login
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              Har du ikke modtaget emailen? Tjek din spam/uønsket mail mappe
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
