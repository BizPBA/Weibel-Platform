import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LocationContactModal } from '@/components/LocationContactModal'
import { Plus, Mail, Phone, User, Edit, Trash2 } from 'lucide-react'

type LocationContact = {
  id: string
  location_id: string
  full_name: string
  email: string
  phone: string | null
  role: string | null
  created_at: string
}

interface LocationContactsSectionProps {
  locationId: string
}

export function LocationContactsSection({ locationId }: LocationContactsSectionProps) {
  const { user, canManageLocations } = useAuth()
  const [contacts, setContacts] = useState<LocationContact[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<LocationContact | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [locationId])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('location_contacts')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setContacts(data || [])
    } catch (error: any) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContact = async (data: any) => {
    try {
      const { error } = await supabase
        .from('location_contacts')
        .insert({
          location_id: locationId,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          role: data.role || null,
        })

      if (error) throw error

      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user?.id,
          action_text: `Tilføjede kontakt: ${data.full_name}`,
        })

      fetchContacts()
    } catch (error: any) {
      console.error('Error creating contact:', error)
      alert('Fejl ved oprettelse af kontakt: ' + error.message)
    }
  }

  const handleUpdateContact = async (data: any) => {
    if (!editingContact) return

    try {
      const { error } = await supabase
        .from('location_contacts')
        .update({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          role: data.role || null,
        })
        .eq('id', editingContact.id)

      if (error) throw error

      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user?.id,
          action_text: `Opdaterede kontakt: ${data.full_name}`,
        })

      setEditingContact(null)
      fetchContacts()
    } catch (error: any) {
      console.error('Error updating contact:', error)
      alert('Fejl ved opdatering af kontakt: ' + error.message)
    }
  }

  const handleDeleteContact = async (contact: LocationContact) => {
    if (!confirm(`Er du sikker på, at du vil slette ${contact.full_name}?`)) return

    try {
      const { error } = await supabase
        .from('location_contacts')
        .delete()
        .eq('id', contact.id)

      if (error) throw error

      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user?.id,
          action_text: `Slettede kontakt: ${contact.full_name}`,
        })

      fetchContacts()
    } catch (error: any) {
      console.error('Error deleting contact:', error)
      alert('Fejl ved sletning af kontakt: ' + error.message)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Kontaktpersoner</span>
          </CardTitle>
          {canManageLocations && (
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Tilføj kontakt
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Ingen kontaktpersoner tilføjet endnu.</p>
            {canManageLocations && (
              <p className="text-sm mt-1">Tilføj kontakter for denne lokation.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{contact.full_name}</h4>
                      {contact.role && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {contact.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <a href={`mailto:${contact.email}`} className="hover:underline">
                        {contact.email}
                      </a>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <a href={`tel:${contact.phone}`} className="hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  {canManageLocations && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        onClick={() => {
                          setEditingContact(contact)
                          setIsModalOpen(true)
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteContact(contact)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <LocationContactModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingContact(null)
        }}
        onSubmit={editingContact ? handleUpdateContact : handleCreateContact}
        initialData={editingContact ? {
          full_name: editingContact.full_name,
          email: editingContact.email,
          phone: editingContact.phone || '',
          role: editingContact.role || '',
        } : null}
        title={editingContact ? 'Rediger kontakt' : 'Tilføj kontakt'}
      />
    </Card>
  )
}
