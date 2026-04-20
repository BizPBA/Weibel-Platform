import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Calendar, Building2, Search, Filter, ArrowUpDown, Plus, AlertCircle } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { FavoriteStarButton } from '@/components/FavoriteStarButton'

type Location = {
  id: string
  customer_id: string
  title: string
  address: string
  zip: string
  city: string
  country: string
  description: string | null
  locker_number: string | null
  created_at: string
}

interface Customer {
  id: string
  name: string
  notes: string | null
  created_at: string
}

interface LocationWithCustomer extends Location {
  customer: Customer
  is_favorite?: boolean
}

type NewLocationForm = {
  customer_id: string
  title: string
  address: string
  zip: string
  city: string
  country: string
  description: string
  locker_number: string
}

export default function Locations() {
  const { profile, canManageLocations } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [locations, setLocations] = useState<LocationWithCustomer[]>([])
  const [filteredLocations, setFilteredLocations] = useState<LocationWithCustomer[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'customer' | 'created_at'>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<NewLocationForm>()

  useEffect(() => {
    if (profile?.company_id) {
      fetchLocations()
    }
  }, [profile?.company_id])

  // Filter, search, and sort locations
  useEffect(() => {
    let filtered = [...locations].map(location => ({
      ...location,
      is_favorite: isFavorite('location', location.id)
    }))

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(location =>
        location.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // Always prioritize favorites first
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1

      // Within same favorite status, apply regular sorting
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'customer':
          aValue = a.customer.name.toLowerCase()
          bValue = b.customer.name.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredLocations(filtered)
  }, [locations, searchTerm, sortBy, sortOrder, isFavorite])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!profile?.company_id) {
        setLocations([])
        setCustomers([])
        setLoading(false)
        return
      }

      // For employees, only fetch their assigned locations
      if (profile.role === 'employee') {
        const { data: assignedLocations, error: assignError } = await supabase
          .from('location_assignments')
          .select(`
            location:locations(
              *,
              customer:customers(*)
            )
          `)
          .eq('user_id', profile.id)

        if (assignError) throw assignError

        const locationsData = assignedLocations
          .map(a => a.location)
          .filter(Boolean) as LocationWithCustomer[]

        setLocations(locationsData)
        setCustomers([])
        setLoading(false)
        return
      }

      // For other roles, fetch all company locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (locationsError) throw locationsError

      // Fetch customers for the dropdown
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name')

      if (customersError) throw customersError

      setLocations(locationsData || [])
      setCustomers(customersData || [])

    } catch (error: any) {
      console.error('Error fetching locations:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (data: NewLocationForm) => {
    createLocation(data)
  }

  const createLocation = async (data: NewLocationForm) => {
    try {
      setLoading(true)
      setError(null)

      if (!profile?.company_id) {
        throw new Error('No company ID found')
      }

      const { error } = await supabase
        .from('locations')
        .insert({
          customer_id: data.customer_id,
          title: data.title,
          address: data.address,
          zip: data.zip,
          city: data.city,
          country: data.country,
          description: data.description || null,
          locker_number: data.locker_number || null,
          company_id: profile.company_id
        })

      if (error) throw error

      // Refresh locations list
      await fetchLocations()
      
      // Close modal and reset form
      setIsAddModalOpen(false)
      reset()

    } catch (error: any) {
      console.error('Error creating location:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-gray-600">Loading locations from database...</p>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Locations</h1>
          <p className="text-gray-600">Manage all project locations</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Locations</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button 
                onClick={fetchLocations} 
                className="mt-3"
                size="sm"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lokationer</h1>
          <p className="text-gray-600">
            {profile?.role === 'employee'
              ? `Dine tildelte lokationer (${filteredLocations.length} lokationer)`
              : `Administrer alle projektlokationer (${filteredLocations.length} af ${locations.length} lokationer)`
            }
          </p>
        </div>
        {canManageLocations && (
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tilføj lokation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
              <DialogHeader>
                <DialogTitle>Tilføj ny lokation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Kunde *</Label>
                  <Controller
                    name="customer_id"
                    control={control}
                    rules={{ required: 'Kunde er påkrævet' }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vælg kunde" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.customer_id && (
                    <p className="text-sm text-red-600">{errors.customer_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Lokationstitel *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Lokationstitel er påkrævet' })}
                    placeholder="Indtast lokationstitel"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse *</Label>
                    <Input
                      id="address"
                      {...register('address', { required: 'Adresse er påkrævet' })}
                      placeholder="Gadeadresse"
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">Postnummer *</Label>
                    <Input
                      id="zip"
                      {...register('zip', { required: 'Postnummer er påkrævet' })}
                      placeholder="Postnummer"
                    />
                    {errors.zip && (
                      <p className="text-sm text-red-600">{errors.zip.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">By *</Label>
                    <Input
                      id="city"
                      {...register('city', { required: 'By er påkrævet' })}
                      placeholder="By"
                    />
                    {errors.city && (
                      <p className="text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Land *</Label>
                    <Input
                      id="country"
                      {...register('country', { required: 'Land er påkrævet' })}
                      placeholder="Land"
                      defaultValue="Danmark"
                    />
                    {errors.country && (
                      <p className="text-sm text-red-600">{errors.country.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locker_number">Skabsnøglenummer</Label>
                  <Input
                    id="locker_number"
                    {...register('locker_number')}
                    placeholder="Indtast skabsnøglenummer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivelse</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Projektbeskrivelse"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Annuller
                  </Button>
                  <Button type="submit">
                    Tilføj lokation
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Søg lokationer, kunder, adresser..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [field, order] = value.split('-')
            setSortBy(field as any)
            setSortOrder(order as any)
          }}>
            <SelectTrigger className="w-48">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">Titel A-Z</SelectItem>
              <SelectItem value="title-desc">Titel Z-A</SelectItem>
              <SelectItem value="customer-asc">Kunde A-Z</SelectItem>
              <SelectItem value="customer-desc">Kunde Z-A</SelectItem>
              <SelectItem value="created_at-desc">Nyeste først</SelectItem>
              <SelectItem value="created_at-asc">Ældste først</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredLocations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Ingen lokationer fundet' : 'Ingen lokationer endnu'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Prøv at justere din søgning' : 'Lokationer vil vises her, når kunder er tilføjet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow flex flex-col relative">
              <FavoriteStarButton
                isFavorite={location.is_favorite || false}
                onToggle={async () => {
                  await toggleFavorite('location', location.id)
                }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{location.title}</CardTitle>
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <Building2 className="w-4 h-4 mr-1" />
                      <span>{location.customer.name}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <div className="flex-1 space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{location.address}, {location.city}</span>
                </div>
                
                {location.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{location.description}</p>
                )}
                </div>
                
                <div className="flex justify-end mt-auto pt-2">
                  <Link to={`/locations/${location.id}`}>
                    <Button variant="outline" size="sm">Se detaljer</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}