'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react'

interface RequirementsTabProps {
  locationId: string
}

export function RequirementsTab({ locationId }: RequirementsTabProps) {
  const { user } = useAuth()
  const [requirements, setRequirements] = useState([])
  const [newRequirement, setNewRequirement] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchRequirements()
    }
  }, [user])

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('location_requirements')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setRequirements(data || [])
    } catch (error) {
      console.error('Error fetching requirements:', error)
      setError('Failed to load safety requirements')
    } finally {
      setLoading(false)
    }
  }

  const addRequirement = async () => {
    if (!newRequirement.trim()) return

    try {
      const { data, error } = await supabase
        .from('location_requirements')
        .insert([
          {
            location_id: locationId,
            requirement_text: newRequirement.trim(),
            is_done: false
          }
        ])
        .select()

      if (error) throw error
      
      setRequirements([...requirements, data[0]])
      setNewRequirement('')
      setError('')
    } catch (error) {
      console.error('Error adding requirement:', error)
      setError('Failed to add requirement')
    }
  }

  const updateRequirement = async (id, newText) => {
    if (!newText.trim()) return

    try {
      const { error } = await supabase
        .from('location_requirements')
        .update({ requirement_text: newText.trim() })
        .eq('id', id)

      if (error) throw error

      setRequirements(requirements.map(req => 
        req.id === id ? { ...req, requirement_text: newText.trim() } : req
      ))
      setEditingId(null)
      setEditingText('')
      setError('')
    } catch (error) {
      console.error('Error updating requirement:', error)
      setError('Failed to update requirement')
    }
  }

  const deleteRequirement = async (id) => {
    try {
      const { error } = await supabase
        .from('location_requirements')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRequirements(requirements.filter(req => req.id !== id))
      setError('')
    } catch (error) {
      console.error('Error deleting requirement:', error)
      setError('Failed to delete requirement')
    }
  }

  const startEditing = (requirement) => {
    setEditingId(requirement.id)
    setEditingText(requirement.requirement_text)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingText('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading safety requirements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Safety Requirements</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sikkerhedsudstyr og krav</h3>
          <p className="text-gray-600 mb-4">
            Angiv det sikkerhedsudstyr og de krav, der er nødvendige for at arbejde på denne lokation (f.eks. sikkerhedssko, hjelm, beskyttelsesudstyr).
          </p>
          {editingId === 'new' ? (
            <div className="flex space-x-2">
              <Textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                placeholder="f.eks. Sikkerhedshjelm, Sikkerhedssko med stålnæse, Refleksvest..."
                rows={4}
                className="resize-none"
                autoFocus
              />
              <div className="flex flex-col space-y-2">
                <Button onClick={() => updateRequirement('new', editingText)} size="sm">
                  <Check className="h-4 w-4" />
                </Button>
                <Button onClick={cancelEditing} variant="outline" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Textarea
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                placeholder="f.eks. Sikkerhedshjelm, Sikkerhedssko med stålnæse, Refleksvest..."
                rows={4}
                className="resize-none"
              />
              <Button onClick={addRequirement} size="sm">
                <Plus className="h-4 w-4" />
                Tilføj sikkerhedskrav
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Current Requirements</h2>
        {requirements.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <p className="text-gray-500">Ingen sikkerhedskrav tilføjet endnu.</p>
              <p className="text-sm text-gray-400 mt-1">Tilføj sikkerhedsudstyr og krav, der er nødvendige for denne lokation.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requirements.map((requirement) => (
              <Card key={requirement.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    {editingId === requirement.id ? (
                      <div className="flex space-x-2">
                        <Textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1"
                          rows={2}
                          placeholder="f.eks. Sikkerhedshjelm, Sikkerhedssko med stålnæse..."
                        />
                        <Button
                          onClick={() => updateRequirement(requirement.id, editingText)}
                          size="sm"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button onClick={cancelEditing} variant="outline" size="sm">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-900 flex-1">{requirement.requirement_text}</p>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            onClick={() => startEditing(requirement)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteRequirement(requirement.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}