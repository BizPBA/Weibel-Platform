'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { EditLocationModal } from '@/components/EditLocationModal'
import { CategorizedRequirementsTab } from '@/components/CategorizedRequirementsTab'
import { FilesTab } from '@/components/FilesTab'
import { ActivityTab } from '@/components/ActivityTab'
import { LocationAssignments } from '@/components/LocationAssignments'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar, Building2, Edit, CheckSquare, Image, Activity, Users, FileText, FolderOpen } from 'lucide-react'
import { LocationContactsSection } from '@/components/LocationContactsSection'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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

interface LocationTabsProps {
  locationId: string
}

export function LocationTabs({ locationId }: LocationTabsProps) {
  const [location, setLocation] = useState<Location | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const { profile, canManageLocations } = useAuth()

  useEffect(() => {
    if (profile?.company_id) {
      fetchLocation()
    }
  }, [locationId, profile?.company_id])

  const fetchLocation = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!profile?.company_id) {
        throw new Error('No company ID found')
      }

      // For employees, verify they have access to this location
      if (profile.role === 'employee') {
        const { data: assignment, error: assignError } = await supabase
          .from('location_assignments')
          .select('id')
          .eq('user_id', profile.id)
          .eq('location_id', locationId)
          .maybeSingle()

        if (assignError) throw assignError
        if (!assignment) {
          throw new Error('Du har ikke adgang til denne lokation')
        }
      }

      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          customer:customers(name)
        `)
        .eq('id', locationId)
        .eq('company_id', profile.company_id)
        .single()

      if (error) throw error

      setLocation(data)
    } catch (error: any) {
      console.error('Error fetching location:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }


  const tabs = [
    { id: 'details', name: 'Detaljer', icon: MapPin },
    { id: 'requirements', name: 'Krav', icon: CheckSquare },
    { id: 'images', name: 'Filer', icon: FolderOpen },
    { id: 'activity', name: 'Aktivitet', icon: Activity },
    { id: 'assignments', name: 'Medarbejdere', icon: Users },
  ]

  if (loading) {
    return <div className="flex items-center justify-center h-48">Indlæser lokation fra database...</div>
  }

  if (error || !location) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lokationsdetaljer</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Fejl ved indlæsning af lokation</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error || 'Lokation ikke fundet'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{location.title}</h1>
          <div className="flex items-center mt-2 space-x-4">
            <div className="flex items-center text-gray-600">
              <Building2 className="w-4 h-4 mr-1" />
              <span>{location.customer.name}</span>
            </div>
          </div>
        </div>
        {canManageLocations && (
          <Button onClick={() => setIsEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Rediger lokation
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6 space-y-6">
        {activeTab === 'details' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Lokationsdetaljer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <p className="text-gray-900">{location.address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">By</label>
                    <p className="text-gray-900">{location.city}, {location.zip}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
                    <p className="text-gray-900">{location.country}</p>
                  </div>
                </div>

                {location.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                    <p className="text-gray-900">{location.description}</p>
                  </div>
                )}

                {location.locker_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skabsnøglenummer</label>
                    <p className="text-gray-900">{location.locker_number}</p>
                  </div>
                )}

                {location.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Noter
                    </label>
                    <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                      {location.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <LocationContactsSection locationId={locationId} />
          </>
        )}

        {activeTab === 'requirements' && (
          <CategorizedRequirementsTab locationId={locationId} />
        )}

        {activeTab === 'images' && (
          <FilesTab locationId={locationId} />
        )}

        {activeTab === 'activity' && (
          <ActivityTab locationId={locationId} />
        )}

        {activeTab === 'assignments' && (
          <LocationAssignments locationId={locationId} locationTitle={location.title} />
        )}
      </div>
      
      {/* Edit Location Modal */}
      {location && (
        <EditLocationModal
          location={location}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onLocationUpdated={fetchLocation}
        />
      )}
    </div>
  )
}