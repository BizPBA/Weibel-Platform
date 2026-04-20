'use client'

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function EmailVerification() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [countdown, setCountdown] = useState(5)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
        }

        if (session?.user?.email_confirmed_at) {
          setStatus('success')
          setMessage('Din email er nu verificeret og din konto er aktiv!')
          return
        }

        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (type === 'signup' && token) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            console.error('Email verification error:', error)
            setStatus('error')
            setMessage('Der opstod en fejl under verifikation af din email. Linket kan være udløbet eller ugyldigt.')
          } else {
            setStatus('success')
            setMessage('Din email er nu verificeret og din konto er aktiv!')
          }
        } else {
          setStatus('success')
          setMessage('Din email er nu verificeret og din konto er aktiv!')
        }
      } catch (error: any) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Der opstod en uventet fejl. Prøv venligst igen senere.')
      }
    }

    handleEmailVerification()
  }, [searchParams])

  useEffect(() => {
    if (status === 'success' && !redirecting) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setRedirecting(true)
            navigate('/login')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [status, navigate, redirecting])

  const handleBackToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-500 p-3 rounded-full">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {status === 'loading' && 'Verificerer din email...'}
            {status === 'success' && 'Din bruger er nu verificeret'}
            {status === 'error' && 'Verifikation fejlede'}
          </CardTitle>
          <CardDescription>
            InfoBridge
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="w-12 h-12 text-red-600" />
            )}
          </div>

          {/* Status Message */}
          <div className="space-y-2">
            <p className={`text-sm ${
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-gray-600'
            }`}>
              {message}
            </p>

            {status === 'success' && (
              <>
                <p className="text-xs text-gray-500">
                  Du kan nu logge ind på platformen med din email og adgangskode.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-blue-900">
                    Omdirigerer til login siden om <span className="font-bold">{countdown}</span> sekunder...
                  </p>
                </div>
              </>
            )}

            {status === 'error' && (
              <p className="text-xs text-gray-500">
                Kontakt venligst support hvis problemet fortsætter.
              </p>
            )}
          </div>

          {/* Back to Login Button */}
          {(status === 'success' || status === 'error') && (
            <Button 
              onClick={handleBackToLogin}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbage til login siden
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}