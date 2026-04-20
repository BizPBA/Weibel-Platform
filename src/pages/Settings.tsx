import { useState } from 'react'
import React from 'react'
import { useAuth } from '@/components/AuthProvider'
// import { PasskeyAuth } from '@/components/PasskeyAuth'
import { CompanySettings } from '@/components/CompanySettings'
import { FolderTemplateManager } from '@/components/FolderTemplateManager'
import { MicrosoftIntegrationCard } from '@/components/MicrosoftIntegrationCard'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Mail, Phone, Shield, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Building2, FolderTree } from 'lucide-react'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  // const [passkeyMessage, setPasskeyMessage] = useState('')
  // const [passkeyError, setPasskeyError] = useState('')

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
      })
    } else if (user) {
      // If no profile but user exists, use user email
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }))
    }
  }, [profile, user])

  const handleSave = async () => {
    if (!user) return
    
    setLoading(true)
    setMessage('')
    setError('')

    try {
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      let profileError
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
          })
          .eq('id', user.id)
        profileError = error
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone || null,
            role: 'technician'
          })
        profileError = error
      }

      if (profileError) {
        console.error('Profile save error:', profileError)
        throw profileError
      }

      // If email changed, update auth email
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        })
        
        if (emailError) {
          console.error('Email update error:', emailError)
          throw emailError
        }
        setMessage('Profile updated successfully! Please check your email to confirm the new email address.')
      } else {
        setMessage('Profile updated successfully!')
      }

    } catch (error: any) {
      console.error('Error saving profile:', error)
      setError(error.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  // const handlePasskeySuccess = () => {
  //   setPasskeyMessage('Passkey operation completed successfully!')
  //   setPasskeyError('')
  //   setTimeout(() => setPasskeyMessage(''), 3000)
  // }

  // const handlePasskeyError = (errorMessage: string) => {
  //   setPasskeyError(errorMessage)
  //   setPasskeyMessage('')
  //   setTimeout(() => setPasskeyError(''), 5000)
  // }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Indstillinger</h1>
        <p className="text-gray-600">Administrer din profil, virksomhed og præferencer</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Virksomhed
          </TabsTrigger>
          <TabsTrigger value="folders" className="flex items-center gap-2">
            <FolderTree className="w-4 h-4" />
            Mappeskabeloner
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Sikkerhed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
        {/* Profile Information - Always full width on mobile, half width on larger screens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profilinformation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Fulde navn</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-error-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center space-x-2 text-success-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>{message}</span>
              </div>
            )}
            
            <Button 
              onClick={handleSave} 
              className="w-full" 
              disabled={loading || !formData.fullName || !formData.email}
            >
              {loading ? 'Gemmer...' : 'Gem ændringer'}
            </Button>
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="folders">
          <FolderTemplateManager />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {profile?.role === 'admin' && (
            <MicrosoftIntegrationCard />
          )}

          {/* Passkey security disabled until feature is reactivated
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Fingerprint className="w-5 h-5" />
                <span>Passkey sikkerhed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Passkeys giver en sikker, password-fri måde at logge ind på.
              </p>

              {passkeyError && (
                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  <span>{passkeyError}</span>
                </div>
              )}

              {passkeyMessage && (
                <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
                  <CheckCircle className="w-4 h-4" />
                  <span>{passkeyMessage}</span>
                </div>
              )}

              <PasskeyAuth
                onSuccess={handlePasskeySuccess}
                onError={handlePasskeyError}
              />
            </CardContent>
          </Card>
          */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Kontodetaljer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Rolle</span>
                </div>
                <p className="text-sm text-gray-600 capitalize">{profile?.role}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Email-verifikation</span>
                </div>
                <p className="text-sm text-gray-600">
                  {user?.email_confirmed_at ? 'Verificeret' : 'Ikke verificeret'}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Konto oprettet</span>
                </div>
                <p className="text-sm text-gray-600">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Ukendt'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}