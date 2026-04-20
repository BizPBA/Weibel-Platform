import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { sendWelcomeEmail } from '@/lib/invitations'
import { useAuth } from '@/components/AuthProvider'
import { UserPlus, Check, AlertCircle, Search, MapPin, AlertTriangle, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { Database } from '@/lib/database.types'

type RoleType = Database['public']['Enums']['user_role']

interface Location {
  id: string
  title: string
  city: string
}

interface LocationAssignment {
  locationId: string
  startDate: string
  endDate: string
  isPermanent: boolean
}

interface CreateEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateEmployeeModal({ open, onOpenChange, onSuccess }: CreateEmployeeModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<RoleType>('employee')
  const [locationAssignments, setLocationAssignments] = useState<LocationAssignment[]>([])
  const [availableLocations, setAvailableLocations] = useState<Location[]>([])
  const [locationSearchTerm, setLocationSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)
  const { profile, company, user } = useAuth()

  useEffect(() => {
    if (open && profile?.company_id) {
      fetchLocations()
    }
  }, [open, profile?.company_id])

  const fetchLocations = async () => {
    try {
      if (!profile?.company_id) return

      const { data, error } = await supabase
        .from('locations')
        .select('id, title, city')
        .eq('company_id', profile.company_id)
        .order('title')

      if (error) throw error
      setAvailableLocations(data || [])
    } catch (error: any) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleLocationToggle = (locationId: string) => {
    setLocationAssignments(prev => {
      const exists = prev.find(a => a.locationId === locationId)
      if (exists) {
        return prev.filter(a => a.locationId !== locationId)
      } else {
        return [...prev, {
          locationId,
          startDate: '',
          endDate: '',
          isPermanent: true
        }]
      }
    })
  }

  const updateLocationTimeframe = (locationId: string, field: keyof Omit<LocationAssignment, 'locationId'>, value: string | boolean) => {
    setLocationAssignments(prev =>
      prev.map(a =>
        a.locationId === locationId
          ? { ...a, [field]: value }
          : a
      )
    )
  }

  const isLocationSelected = (locationId: string) => {
    return locationAssignments.some(a => a.locationId === locationId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    setEmailWarning(null)

    try {
      // Validate date ranges for each location
      for (const assignment of locationAssignments) {
        if (!assignment.isPermanent && assignment.startDate && assignment.endDate) {
          if (new Date(assignment.endDate) < new Date(assignment.startDate)) {
            const location = availableLocations.find(l => l.id === assignment.locationId)
            setError(`Slutdato skal være efter startdato for ${location?.title}`)
            setLoading(false)
            return
          }
        }
      }

      // Transform location assignments to database format
      const locationAssignmentsJson = locationAssignments.map(a => ({
        location_id: a.locationId,
        start_date: a.startDate || null,
        end_date: a.isPermanent ? null : (a.endDate || null),
        is_permanent: a.isPermanent
      }))

      const { data, error: rpcError } = await supabase.rpc('create_manual_employee', {
        p_full_name: fullName.trim(),
        p_email: email.toLowerCase().trim(),
        p_role: role,
        p_phone: phone.trim() || null,
        p_location_assignments: locationAssignmentsJson
      })

      if (rpcError) throw rpcError

      setSuccess(true)

      // Send welcome email
      if (company && user && profile) {
        const emailResult = await sendWelcomeEmail({
          email: email.toLowerCase().trim(),
          fullName: fullName.trim(),
          companyName: company.name,
          companyLogo: company.logo_url,
          role: role,
          adminName: profile.full_name || user.email || 'Administrator',
          adminEmail: user.email || '',
        })

        if (!emailResult.success) {
          console.error('Welcome email failed:', emailResult.error)
          setEmailWarning(
            'Medarbejderen er oprettet, men velkomst-emailen kunne ikke sendes.'
          )
        }
      }

      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onSuccess?.()
      }, emailWarning ? 3000 : 2000)
    } catch (err: any) {
      console.error('Create employee error:', err)
      setError(err.message || 'Kunne ikke oprette medarbejder')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setRole('employee')
    setLocationAssignments([])
    setLocationSearchTerm('')
    setError(null)
    setSuccess(false)
    setEmailWarning(null)
  }

  const handleClose = () => {
    if (!loading) {
      resetForm()
      onOpenChange(false)
    }
  }

  const filteredLocations = availableLocations.filter(location =>
    location.title.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
    location.city.toLowerCase().includes(locationSearchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Opret medarbejder
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Medarbejder oprettet!</h3>
            <p className="text-sm text-slate-600">
              {fullName} er blevet tilføjet til teamet
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
              <Label htmlFor="fullName">
                Fulde navn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Anders Jensen"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">
                E-mail <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anders@firma.dk"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">
                Telefon
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+45 12 34 56 78"
                className="mt-1.5"
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

            <div>
              <Label>Tildel lokationer</Label>
              <div className="mt-2 space-y-2">
                {availableLocations.length > 0 ? (
                  <>
                    {availableLocations.length > 5 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Søg lokationer..."
                          value={locationSearchTerm}
                          onChange={(e) => setLocationSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    )}
                    <div className="max-h-96 overflow-y-auto border rounded-lg p-3 space-y-3">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((location) => {
                          const isSelected = isLocationSelected(location.id)
                          const assignment = locationAssignments.find(a => a.locationId === location.id)

                          return (
                            <div key={location.id} className={`border rounded-lg p-3 ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`location-${location.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => handleLocationToggle(location.id)}
                                />
                                <label
                                  htmlFor={`location-${location.id}`}
                                  className="text-sm font-medium cursor-pointer flex items-center gap-1.5 flex-1"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                  {location.title} - {location.city}
                                </label>
                              </div>

                              {isSelected && assignment && (
                                <div className="mt-3 pt-3 border-t space-y-3">
                                  <div className="space-y-2">
                                    <Label htmlFor={`start-${location.id}`} className="text-xs">Start dato</Label>
                                    <Input
                                      id={`start-${location.id}`}
                                      type="date"
                                      value={assignment.startDate}
                                      onChange={(e) => updateLocationTimeframe(location.id, 'startDate', e.target.value)}
                                      className="text-sm"
                                    />
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`permanent-${location.id}`}
                                      checked={assignment.isPermanent}
                                      onCheckedChange={(checked) => {
                                        updateLocationTimeframe(location.id, 'isPermanent', checked as boolean)
                                        if (checked) {
                                          updateLocationTimeframe(location.id, 'endDate', '')
                                        }
                                      }}
                                    />
                                    <label htmlFor={`permanent-${location.id}`} className="text-sm cursor-pointer">
                                      Permanent tilknytning
                                    </label>
                                  </div>

                                  {!assignment.isPermanent && (
                                    <div className="space-y-2">
                                      <Label htmlFor={`end-${location.id}`} className="text-xs">Slut dato</Label>
                                      <Input
                                        id={`end-${location.id}`}
                                        type="date"
                                        value={assignment.endDate}
                                        onChange={(e) => updateLocationTimeframe(location.id, 'endDate', e.target.value)}
                                        min={assignment.startDate || undefined}
                                        className="text-sm"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Ingen lokationer fundet
                        </p>
                      )}
                    </div>
                    {locationAssignments.length > 0 && (
                      <p className="text-xs text-slate-600">
                        {locationAssignments.length} lokation(er) valgt med timeframes
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 py-2">
                    Ingen lokationer tilgængelige
                  </p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                Medarbejderen vil modtage en velkomst-email med instruktioner til login via Microsoft (når det er konfigureret).
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
                {loading ? 'Opretter...' : 'Opret medarbejder'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
