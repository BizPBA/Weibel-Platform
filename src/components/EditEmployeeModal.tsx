import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { CreditCard as Edit, Check, CircleAlert as AlertCircle, Search, MapPin, Trash2 } from 'lucide-react'
import { Database } from '@/lib/database.types'
import { getRoleLabel } from '@/lib/permissions'

type RoleType = Database['public']['Enums']['user_role']

interface Location {
  id: string
  title: string
  city: string
}

interface Employee {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: RoleType
  location_assignments?: {
    location: {
      id: string
      title: string
      city: string
    }
  }[]
}

interface EditEmployeeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
  onSuccess?: () => void
}

export function EditEmployeeModal({ open, onOpenChange, employee, onSuccess }: EditEmployeeModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<RoleType>('employee')
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [availableLocations, setAvailableLocations] = useState<Location[]>([])
  const [locationSearchTerm, setLocationSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [initialLocationIds, setInitialLocationIds] = useState<string[]>([])
  const [newLocationStartDate, setNewLocationStartDate] = useState<string>('')
  const [newLocationEndDate, setNewLocationEndDate] = useState<string>('')
  const [newLocationIsPermanent, setNewLocationIsPermanent] = useState<boolean>(true)
  const { profile, user } = useAuth()

  useEffect(() => {
    if (open && employee) {
      setFullName(employee.full_name || '')
      setEmail(employee.email || '')
      setPhone(employee.phone || '')
      setRole(employee.role)

      const locationIds = employee.location_assignments?.map(a => a.location.id) || []
      setSelectedLocations(locationIds)
      setInitialLocationIds(locationIds)

      if (profile?.company_id) {
        fetchLocations()
      }
    }
  }, [open, employee, profile?.company_id])

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
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          role: role
        })
        .eq('id', employee.id)

      if (profileError) throw profileError

      // Get current location assignments
      const { data: currentAssignments, error: fetchError } = await supabase
        .from('location_assignments')
        .select('location_id')
        .eq('user_id', employee.id)

      if (fetchError) throw fetchError

      const currentLocationIds = currentAssignments?.map(a => a.location_id) || []

      // Determine which locations to add and remove
      const locationsToAdd = selectedLocations.filter(id => !currentLocationIds.includes(id))
      const locationsToRemove = currentLocationIds.filter(id => !selectedLocations.includes(id))

      // Remove unassigned locations
      if (locationsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('location_assignments')
          .delete()
          .eq('user_id', employee.id)
          .in('location_id', locationsToRemove)

        if (deleteError) throw deleteError
      }

      // Validate dates if not permanent
      if (locationsToAdd.length > 0 && !newLocationIsPermanent && newLocationStartDate && newLocationEndDate) {
        if (new Date(newLocationEndDate) < new Date(newLocationStartDate)) {
          setError('Slutdato skal være efter startdato')
          setLoading(false)
          return
        }
      }

      // Add new location assignments with timeframe
      if (locationsToAdd.length > 0) {
        const newAssignments = locationsToAdd.map(locationId => ({
          location_id: locationId,
          user_id: employee.id,
          assigned_by: user?.id || profile?.id,
          start_date: newLocationStartDate || null,
          end_date: newLocationIsPermanent ? null : (newLocationEndDate || null),
          is_active: true
        }))

        const { error: insertError } = await supabase
          .from('location_assignments')
          .insert(newAssignments)

        if (insertError) throw insertError
      }

      // Log the action
      await supabase
        .from('company_audit_log')
        .insert({
          company_id: profile?.company_id,
          user_id: user?.id,
          action: 'update_employee',
          new_values: {
            employee_id: employee.id,
            employee_email: employee.email,
            changes: {
              full_name: fullName !== employee.full_name,
              phone: phone !== employee.phone,
              role: role !== employee.role,
              locations_modified: locationsToAdd.length > 0 || locationsToRemove.length > 0
            }
          }
        })

      setSuccess(true)
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onSuccess?.()
      }, 1500)
    } catch (err: any) {
      console.error('Update employee error:', err)
      setError(err.message || 'Kunne ikke opdatere medarbejder')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setRole('employee')
    setSelectedLocations([])
    setInitialLocationIds([])
    setLocationSearchTerm('')
    setNewLocationStartDate('')
    setNewLocationEndDate('')
    setNewLocationIsPermanent(true)
    setError(null)
    setSuccess(false)
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

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Rediger medarbejder
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Opdateret!</h3>
            <p className="text-sm text-slate-600">
              Ændringerne er blevet gemt
            </p>
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
              <Label htmlFor="edit-fullName">
                Fulde navn <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Anders Jensen"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-email">
                E-mail
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                className="mt-1.5 bg-gray-50"
                disabled
                readOnly
              />
              <p className="text-xs text-slate-500 mt-1">
                Email kan ikke ændres
              </p>
            </div>

            <div>
              <Label htmlFor="edit-phone">
                Telefon
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+45 12 34 56 78"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="edit-role">
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
              <Label>Tildelte lokationer</Label>
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
                    <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((location) => (
                          <div key={location.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-location-${location.id}`}
                              checked={selectedLocations.includes(location.id)}
                              onCheckedChange={() => handleLocationToggle(location.id)}
                            />
                            <label
                              htmlFor={`edit-location-${location.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
                            >
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              {location.title} - {location.city}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Ingen lokationer fundet
                        </p>
                      )}
                    </div>
                    {selectedLocations.length > 0 && (
                      <p className="text-xs text-slate-600">
                        {selectedLocations.length} lokation(er) valgt
                      </p>
                    )}

                    {/* Timeframe for New Locations */}
                    {selectedLocations.some(id => !initialLocationIds.includes(id)) && (
                      <div className="mt-4 p-3 border rounded-lg bg-blue-50 border-blue-200 space-y-3">
                        <p className="text-sm font-medium text-blue-900">Timeframe for nye lokationer</p>
                        <div className="space-y-2">
                          <Label htmlFor="new-start-date" className="text-xs">Start dato</Label>
                          <Input
                            id="new-start-date"
                            type="date"
                            value={newLocationStartDate}
                            onChange={(e) => setNewLocationStartDate(e.target.value)}
                            className="text-sm bg-white"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="new-permanent"
                            checked={newLocationIsPermanent}
                            onCheckedChange={(checked) => {
                              setNewLocationIsPermanent(checked as boolean)
                              if (checked) {
                                setNewLocationEndDate('')
                              }
                            }}
                          />
                          <label htmlFor="new-permanent" className="text-sm cursor-pointer">
                            Permanent tilknytning
                          </label>
                        </div>

                        {!newLocationIsPermanent && (
                          <div className="space-y-2">
                            <Label htmlFor="new-end-date" className="text-xs">Slut dato</Label>
                            <Input
                              id="new-end-date"
                              type="date"
                              value={newLocationEndDate}
                              onChange={(e) => setNewLocationEndDate(e.target.value)}
                              min={newLocationStartDate || undefined}
                              className="text-sm bg-white"
                            />
                          </div>
                        )}

                        <p className="text-xs text-blue-800">
                          Dette timeframe anvendes på alle nye lokationer der tilføjes.
                        </p>
                      </div>
                    )}

                    {initialLocationIds.length > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        For at redigere eksisterende lokationstilknytninger, brug 'Rediger timeframe' knappen på lokationssiden.
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
                {loading ? 'Gemmer...' : 'Gem ændringer'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
