'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle } from 'lucide-react'

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
  notes: string | null
  created_at: string
  customer: {
    name: string
  }
}

type Customer = {
  id: string
  name: string
}

type EditLocationForm = {
  customer_id: string
  title: string
  address: string
  zip: string
  city: string
  country: string
  description: string
  locker_number: string
  notes: string
}

interface EditLocationModalProps {
  location: Location
  isOpen: boolean
  onClose: () => void
  onLocationUpdated: () => void
}

export function EditLocationModal({ location, isOpen, onClose, onLocationUpdated }: EditLocationModalProps) {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<EditLocationForm>()

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      populateForm()
    }
  }, [isOpen, location])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      console.error('Error fetching customers:', error)
    }
  }

  const populateForm = () => {
    reset({
      customer_id: location.customer_id,
      title: location.title,
      address: location.address,
      zip: location.zip,
      city: location.city,
      country: location.country,
      description: location.description || '',
      locker_number: location.locker_number || '',
      notes: location.notes || '',
    })
  }

  const onSubmit = async (data: EditLocationForm) => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const updateData = {
        customer_id: data.customer_id,
        title: data.title,
        address: data.address,
        zip: data.zip,
        city: data.city,
        country: data.country,
        description: data.description || null,
        locker_number: data.locker_number || null,
        notes: data.notes || null,
      }

      const { error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', location.id)

      if (error) throw error

      // Log activity
      await supabase
        .from('location_activity')
        .insert({
          location_id: location.id,
          actor_id: user.id,
          action_text: `Updated location details`
        })

      setSuccess('Location updated successfully!')
      onLocationUpdated()
      
      setTimeout(() => {
        onClose()
        setSuccess(null)
      }, 1500)

    } catch (error: any) {
      console.error('Error updating location:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-2 w-[calc(100vw-1rem)] sm:mx-4 sm:w-[calc(100vw-2rem)] lg:w-full">
        <DialogHeader>
          <DialogTitle>Rediger lokation</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Land *</Label>
              <Input
                id="country"
                {...register('country', { required: 'Land er påkrævet' })}
                placeholder="Land"
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

          <div className="space-y-2">
            <Label htmlFor="notes">Noter</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Generelle noter om lokationen, adgangsinstruktioner, etc."
              rows={4}
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuller
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Gemmer...' : 'Gem ændringer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}