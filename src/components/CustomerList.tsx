'use client'

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Building2, Mail, Phone, MapPin, Search, Filter, ArrowUpDown, Edit, X, ExternalLink } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { FavoriteStarButton } from '@/components/FavoriteStarButton'

type Customer = {
  id: string
  name: string
  notes: string | null
  folder_id: string | null
  created_at: string
}

type CustomerContact = {
  id: string
  customer_id: string
  full_name: string
  email: string
  phone: string | null
  created_at: string
}

interface CustomerWithData extends Customer {
  contacts: CustomerContact[]
  locationCount: number
  is_favorite?: boolean
}

type LocationForCustomer = {
  id: string
  title: string
  address: string
  city: string
  created_at: string
}

type NewCustomerForm = {
  name: string
  notes: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

type EditCustomerForm = {
  name: string
  notes: string
  contacts: {
    id?: string
    full_name: string
    email: string
    phone: string
  }[]
}

export function CustomerList() {
  const { profile } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [customers, setCustomers] = useState<CustomerWithData[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithData[]>([])
  const [customerLocations, setCustomerLocations] = useState<{ [customerId: string]: LocationForCustomer[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'locationCount'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterBy, setFilterBy] = useState<'all' | 'hasContacts' | 'noContacts'>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithData | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const { register, handleSubmit, reset, setValue: setValueCreate, formState: { errors } } = useForm<NewCustomerForm>()
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue, watch, formState: { errors: editErrors } } = useForm<EditCustomerForm>()

  const watchedContacts = watch('contacts') || []

  const addNewContact = () => {
    if (!selectedCustomer) return
    
    const currentContacts = watchedContacts.length > 0 ? watchedContacts : selectedCustomer.contacts.map(contact => ({
      id: contact.id,
      full_name: contact.full_name,
      email: contact.email,
      phone: contact.phone || ''
    }))
    
    const newContact = {
      full_name: '',
      email: '',
      phone: ''
    }
    
    const updatedContacts = [...currentContacts, newContact]
    setValue('contacts', updatedContacts)
  }

  const removeContact = (index: number) => {
    if (watchedContacts.length <= 1) return // Don't allow removing the last contact
    
    const updatedContacts = watchedContacts.filter((_, i) => i !== index)
    setValue('contacts', updatedContacts)
  }

  useEffect(() => {
    if (profile?.company_id) {
      fetchCustomersFromDatabase()
    }
  }, [profile?.company_id])

  // Filter, search, and sort customers
  useEffect(() => {
    let filtered = [...customers].map(customer => ({
      ...customer,
      is_favorite: isFavorite('customer', customer.id)
    }))

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contacts.some(contact =>
          contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply contact filter
    if (filterBy === 'hasContacts') {
      filtered = filtered.filter(customer => customer.contacts.length > 0)
    } else if (filterBy === 'noContacts') {
      filtered = filtered.filter(customer => customer.contacts.length === 0)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      // Always prioritize favorites first
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1

      // Within same favorite status, apply regular sorting
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'locationCount':
          aValue = a.locationCount
          bValue = b.locationCount
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, sortBy, sortOrder, filterBy, isFavorite])

  const onSubmit = (data: NewCustomerForm) => {
    createCustomer(data)
  }

  const createCustomer = async (data: NewCustomerForm) => {
    try {
      setLoading(true)
      setError(null)

      if (!profile?.company_id) {
        throw new Error('No company ID found')
      }

      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: data.name,
          notes: data.notes || null,
          folder_id: null,
          company_id: profile.company_id
        })
        .select()
        .single()

      if (customerError) throw customerError

      // Create contact
      const { error: contactError } = await supabase
        .from('customer_contacts')
        .insert({
          customer_id: customer.id,
          full_name: data.contactName,
          email: data.contactEmail,
          phone: data.contactPhone || null
        })

      if (contactError) throw contactError

      // Refresh customers list
      await fetchCustomersFromDatabase()
      
      // Close modal and reset form
      setIsAddModalOpen(false)
      reset()

    } catch (error: any) {
      console.error('Error creating customer:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const openDetailsModal = (customer: CustomerWithData) => {
    setSelectedCustomer(customer)
    setIsEditMode(false) // Start i visnings-tilstand
    
    // Fetch locations for this customer
    fetchCustomerLocations(customer.id)
    
    // Pre-populate the form with customer data
    setValue('name', customer.name)
    setValue('notes', customer.notes || '')
    setValue('contacts', customer.contacts.map(contact => ({
      id: contact.id,
      full_name: contact.full_name,
      email: contact.email,
      phone: contact.phone || ''
    })))
    
    setIsDetailsModalOpen(true)
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  const fetchCustomerLocations = async (customerId: string) => {
    try {
      if (!profile?.company_id) return

      const { data, error } = await supabase
        .from('locations')
        .select('id, title, address, city, created_at')
        .eq('customer_id', customerId)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCustomerLocations(prev => ({
        ...prev,
        [customerId]: data || []
      }))
    } catch (error: any) {
      console.error('Error fetching customer locations:', error)
    }
  }

  const onSubmitEdit = (data: EditCustomerForm) => {
    if (!selectedCustomer) return
    
    updateCustomer(data)
  }

  const getLocationStatusColor = (status: string) => {
    return 'bg-gray-100 text-gray-800'
  }

  const getLocationStatusText = (status: string) => {
    return 'Active'
  }

  const updateCustomer = async (data: EditCustomerForm) => {
    if (!selectedCustomer) return
    
    setLoading(true)
    setError(null)
    
    try {
      // 1. Update customer basic info
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          name: data.name,
          notes: data.notes || null
        })
        .eq('id', selectedCustomer.id)
      
      if (customerError) {
        throw customerError
      }
      
      // 2. Handle contacts - delete existing and insert new ones
      // First, delete all existing contacts for this customer
      const { error: deleteContactsError } = await supabase
        .from('customer_contacts')
        .delete()
        .eq('customer_id', selectedCustomer.id)
      
      if (deleteContactsError) {
        throw deleteContactsError
      }
      
      // Then insert the updated contacts
      if (data.contacts && data.contacts.length > 0) {
        const contactsToInsert = data.contacts.map(contact => ({
          customer_id: selectedCustomer.id,
          full_name: contact.full_name,
          email: contact.email,
          phone: contact.phone || null
        }))
        
        const { error: insertContactsError } = await supabase
          .from('customer_contacts')
          .insert(contactsToInsert)
        
        if (insertContactsError) {
          throw insertContactsError
        }
      }
      
      // 3. Refresh the customer list to show updated data
      await fetchCustomersFromDatabase()
      
      // 4. Close modal and show success
      setIsDetailsModalOpen(false)
      resetEdit()
      setIsEditMode(false)
      setSelectedCustomer(null)
      
    } catch (error: any) {
      const errorMessage = `Failed to update customer: ${error.message}`
      setError(errorMessage)
      alert(`❌ Error updating customer: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomersFromDatabase = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!profile?.company_id) {
        setCustomers([])
        setLoading(false)
        return
      }

      // Get customers with contacts and location counts
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          customer_contacts(*),
          locations(id)
        `)
        .eq('company_id', profile.company_id)
        .order('name')

      if (customersError) {
        throw customersError
      }
      
      // Transform the data to match our interface
      const transformedCustomers: CustomerWithData[] = customersData.map(customer => ({
        id: customer.id,
        name: customer.name,
        notes: customer.notes,
        folder_id: customer.folder_id,
        created_at: customer.created_at,
        contacts: customer.customer_contacts,
        locationCount: customer.locations.length
      }))
      
      setCustomers(transformedCustomers)
      
    } catch (error: any) {
      console.error('Error fetching customers:', error)
      setError(error.message)
      
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Loading customers from database...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your customer database</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Customers</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <Button 
                onClick={fetchCustomersFromDatabase} 
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
          <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
          <p className="text-gray-600">Administrer din kundedatabase ({filteredCustomers.length} af {customers.length} kunder)</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tilføj kunde
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
            <DialogHeader>
              <DialogTitle>Tilføj ny kunde</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Firmanavn *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Firmanavn er påkrævet' })}
                  placeholder="Indtast firmanavn"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Noter</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Yderligere noter om kunden"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Primær kontakt</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="contactName">Kontaktnavn *</Label>
                  <Input
                    id="contactName"
                    {...register('contactName', { required: 'Kontaktnavn er påkrævet' })}
                    placeholder="Indtast kontaktnavn"
                  />
                  {errors.contactName && (
                    <p className="text-sm text-red-600">{errors.contactName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Kontakt email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    {...register('contactEmail', { 
                      required: 'Kontakt email er påkrævet',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Ugyldig email-adresse'
                      }
                    })}
                    placeholder="Indtast kontakt email"
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-600">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Kontakt telefon</Label>
                  <Input
                    id="contactPhone"
                    {...register('contactPhone')}
                    placeholder="Indtast kontakt telefon"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Annuller
                </Button>
                <Button type="submit">
                  Tilføj kunde
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Customer Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 w-[calc(100vw-1rem)] sm:mx-4 sm:w-[calc(100vw-2rem)] lg:w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Kundedetaljer</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedCustomer && (
              <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold">Kundeinformation</h3>
                    <Button 
                      type="button" 
                      variant={isEditMode ? "outline" : "default"}
                      size="sm" 
                      className="text-xs sm:text-sm"
                      onClick={toggleEditMode}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditMode ? 'Annuller' : 'Rediger'}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Firmanavn *</Label>
                      {isEditMode ? (
                        <Input
                          id="edit-name"
                          {...registerEdit('name', { required: 'Firmanavn er påkrævet' })}
                          placeholder="Indtast firmanavn"
                        />
                      ) : (
                        <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-900">
                          {selectedCustomer.name}
                        </p>
                      )}
                      {editErrors.name && (
                        <p className="text-sm text-red-600">{editErrors.name.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Oprettet</Label>
                      <p className="text-sm text-gray-600 py-2">
                        {new Date(selectedCustomer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Noter</Label>
                    {isEditMode ? (
                      <Textarea
                        id="edit-notes"
                        {...registerEdit('notes')}
                        placeholder="Yderligere noter om kunden"
                        rows={3}
                      />
                    ) : (
                      <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-900 min-h-[80px]">
                        {selectedCustomer.notes || 'Ingen noter'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold">Kontakter</h3>
                    {isEditMode && (
                      <Button type="button" variant="outline" size="sm" onClick={addNewContact}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tilføj kontakt
                      </Button>
                    )}
                  </div>
                  
                  {watchedContacts && watchedContacts.length > 0 ? (
                    <div className="space-y-3">
                      {watchedContacts.map((contact, index) => (
                        <div key={contact.id || `contact-${index}`} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm text-gray-700">Kontakt {index + 1}</h4>
                            {isEditMode && watchedContacts.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeContact(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`contact-name-${index}`}>Navn *</Label>
                              {isEditMode ? (
                                <Input
                                  id={`contact-name-${index}`}
                                  {...registerEdit(`contacts.${index}.full_name`, { required: 'Navn er påkrævet' })}
                                  placeholder="Kontaktnavn"
                                />
                              ) : (
                                <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-900">
                                  {contact.full_name}
                                </p>
                              )}
                              {editErrors.contacts?.[index]?.full_name && (
                                <p className="text-sm text-red-600">{editErrors.contacts?.[index]?.full_name?.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`contact-email-${index}`}>Email *</Label>
                              {isEditMode ? (
                                <Input
                                  id={`contact-email-${index}`}
                                  type="email"
                                  {...registerEdit(`contacts.${index}.email`, { 
                                    required: 'Email er påkrævet',
                                    pattern: {
                                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                      message: 'Ugyldig email-adresse'
                                    }
                                  })}
                                  placeholder="Kontakt email"
                                />
                              ) : (
                                <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-900">
                                  {contact.email}
                                </p>
                              )}
                              {editErrors.contacts?.[index]?.email && (
                                <p className="text-sm text-red-600">{editErrors.contacts?.[index]?.email?.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`contact-phone-${index}`}>Telefon</Label>
                              {isEditMode ? (
                                <Input
                                  id={`contact-phone-${index}`}
                                  {...registerEdit(`contacts.${index}.phone`)}
                                  placeholder="Kontakt telefon"
                                />
                              ) : (
                                <p className="py-2 px-3 bg-gray-50 rounded-md text-gray-900">
                                  {contact.phone || 'Ingen telefon'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Ingen kontakter tilføjet for denne kunde.</p>
                  )}
                </div>

                {/* Locations Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Lokationer ({customerLocations[selectedCustomer.id]?.length || 0})</h3>
                  
                  {customerLocations[selectedCustomer.id]?.length > 0 ? (
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <table className="w-full border-collapse border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium text-xs sm:text-sm">Lokation</th>
                            <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium text-xs sm:text-sm hidden sm:table-cell">Adresse</th>
                            <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium text-xs sm:text-sm">By</th>
                            <th className="border border-gray-200 px-2 sm:px-4 py-2 text-left font-medium text-xs sm:text-sm hidden md:table-cell">Oprettet</th>
                            <th className="border border-gray-200 px-2 sm:px-4 py-2 text-center font-medium text-xs sm:text-sm">Handling</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerLocations[selectedCustomer.id].map((location) => (
                            <tr key={location.id} className="hover:bg-gray-50">
                              <td className="border border-gray-200 px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm">{location.title}</td>
                              <td className="border border-gray-200 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{location.address}</td>
                              <td className="border border-gray-200 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600">{location.city}</td>
                              <td className="border border-gray-200 px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                                {new Date(location.created_at).toLocaleDateString()}
                              </td>
                              <td className="border border-gray-200 px-2 sm:px-4 py-2 text-center">
                                <Link to={`/locations/${location.id}`}>
                                  <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Ingen lokationer fundet for denne kunde.</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                    Luk
                  </Button>
                  {isEditMode && (
                    <Button type="submit">
                      Gem ændringer
                    </Button>
                  )}
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Søg kunder, kontakter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kunder</SelectItem>
              <SelectItem value="hasContacts">Har kontakter</SelectItem>
              <SelectItem value="noContacts">Ingen kontakter</SelectItem>
            </SelectContent>
          </Select>

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
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="created_at-desc">Nyeste først</SelectItem>
              <SelectItem value="created_at-asc">Ældste først</SelectItem>
              <SelectItem value="locationCount-desc">Flest lokationer</SelectItem>
              <SelectItem value="locationCount-asc">Færrest lokationer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterBy !== 'all' ? 'Ingen kunder fundet' : 'Ingen kunder endnu'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterBy !== 'all' ? 'Prøv at justere din søgning eller filtre' : 'Tilføj din første kunde for at komme i gang'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow flex flex-col relative">
              <FavoriteStarButton
                isFavorite={customer.is_favorite || false}
                onToggle={async () => {
                  await toggleFavorite('customer', customer.id)
                }}
              />
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-primary-600" />
                  <span>{customer.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                <div className="flex-1">
                {customer.contacts.length > 0 ? (
                  <div className="space-y-2">
                    {customer.contacts.slice(0, 2).map((contact) => (
                      <div key={contact.id} className="text-sm">
                        <div className="flex items-center text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          <span>{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center text-gray-600 mt-1">
                            <Phone className="w-4 h-4 mr-2" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Ingen kontakter tilføjet</p>
                )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t mt-auto">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{customer.locationCount} lokationer</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openDetailsModal(customer)}>
                    Se detaljer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}