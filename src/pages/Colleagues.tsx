import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendInvitationEmail } from '@/lib/invitations'
import { useAuth } from '@/components/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { InviteTeamMemberModal } from '@/components/InviteTeamMemberModal'
import { CreateEmployeeModal } from '@/components/CreateEmployeeModal'
import { EditEmployeeModal } from '@/components/EditEmployeeModal'
import { Search, Filter, ArrowUpDown, UserCheck, Mail, Phone, MapPin, AlertCircle, UserPlus, Shield, Clock, RefreshCw, X, Users } from 'lucide-react'
import { getRoleLabel, getRoleColor } from '@/lib/permissions'
import { Database } from '@/lib/database.types'

type RoleType = Database['public']['Enums']['user_role']

type Employee = {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: RoleType
  created_at: string
  location_assignments?: {
    location: {
      id: string
      title: string
      city: string
    }
  }[]
}

type PendingInvitation = {
  id: string
  email: string
  role: RoleType
  status: string
  expires_at: string
  created_at: string
  invite_code: string
}

export default function Colleagues() {
  const { profile, company, isAdmin, user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'created_at'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [filterBy, setFilterBy] = useState<'all' | RoleType>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [locationSearchTerm, setLocationSearchTerm] = useState('')
  const [availableLocations, setAvailableLocations] = useState<{id: string, title: string, city: string}[]>([])
  const [filteredLocations, setFilteredLocations] = useState<{id: string, title: string, city: string}[]>([])
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [createEmployeeModalOpen, setCreateEmployeeModalOpen] = useState(false)
  const [editEmployeeModalOpen, setEditEmployeeModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  useEffect(() => {
    if (profile?.company_id) {
      fetchEmployees()
      fetchLocations()
      if (isAdmin) {
        fetchPendingInvitations()
      }
    }
  }, [profile?.company_id, isAdmin])

  useEffect(() => {
    let filtered = [...availableLocations]

    if (locationSearchTerm) {
      filtered = filtered.filter(location =>
        location.title.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
        location.city.toLowerCase().includes(locationSearchTerm.toLowerCase())
      )
    }

    setFilteredLocations(filtered)
  }, [availableLocations, locationSearchTerm])

  useEffect(() => {
    let filtered = [...employees]

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.phone && employee.phone.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (filterBy !== 'all') {
      filtered = filtered.filter(employee => employee.role === filterBy)
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(employee =>
        employee.location_assignments?.some(assignment =>
          assignment.location.id === locationFilter
        )
      )
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.full_name.toLowerCase()
          bValue = b.full_name.toLowerCase()
          break
        case 'role':
          aValue = a.role
          bValue = b.role
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          aValue = a.full_name.toLowerCase()
          bValue = b.full_name.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredEmployees(filtered)
  }, [employees, searchTerm, sortBy, sortOrder, filterBy, locationFilter])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!profile?.company_id) return

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          location_assignments!location_assignments_user_id_fkey(
            location:locations(id, title, city)
          )
        `)
        .eq('company_id', profile.company_id)
        .order('full_name')

      if (profilesError) throw profilesError

      setEmployees(profilesData || [])
    } catch (error: any) {
      console.error('Error fetching employees:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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
      setFilteredLocations(data || [])
    } catch (error: any) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchPendingInvitations = async () => {
    try {
      if (!profile?.company_id) return

      const { data, error } = await supabase
        .from('company_invitations')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingInvitations(data || [])
    } catch (error: any) {
      console.error('Error fetching pending invitations:', error)
    }
  }

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    if (!company || !user || !profile) return

    setResendingId(invitation.id)

    try {
      const result = await sendInvitationEmail({
        email: invitation.email,
        companyName: company.name,
        companyLogo: company.logo_url,
        role: invitation.role,
        inviteCode: invitation.invite_code,
        inviterName: profile.full_name || user.email || 'En kollega',
        expiresAt: invitation.expires_at,
      })

      if (!result.success) {
        throw new Error(result.error || 'Kunne ikke sende email')
      }

      alert('Invitationen er sendt igen!')
    } catch (error: any) {
      console.error('Error resending invitation:', error)
      alert('Kunne ikke sende invitationen igen: ' + error.message)
    } finally {
      setResendingId(null)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('company_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)

      if (error) throw error

      await fetchPendingInvitations()
    } catch (error: any) {
      console.error('Error cancelling invitation:', error)
      alert('Kunne ikke annullere invitationen: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">Indlæser teammedlemmer...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">Teamoversigt</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Fejl ved indlæsning</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600">
            {company?.name} ({filteredEmployees.length} af {employees.length} medlemmer)
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Inviter medlem
            </Button>
            <Button onClick={() => setCreateEmployeeModalOpen(true)} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Opret medarbejder
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Søg teammedlemmer..."
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
              <SelectItem value="all">Alle roller</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="customer_responsible">Kunde ansvarlig</SelectItem>
              <SelectItem value="location_responsible">Lokation ansvarlig</SelectItem>
              <SelectItem value="employee">Medarbejder</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-48">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Alle lokationer" />
            </SelectTrigger>
            <SelectContent className="w-80">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Søg lokationer..."
                    value={locationSearchTerm}
                    onChange={(e) => setLocationSearchTerm(e.target.value)}
                    className="pl-8 h-8"
                  />
                </div>
              </div>
              <SelectItem value="all">Alle lokationer</SelectItem>
              {filteredLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.title} - {location.city}
                </SelectItem>
              ))}
              {filteredLocations.length === 0 && locationSearchTerm && (
                <div className="p-2 text-sm text-gray-500 text-center">
                  Ingen lokationer fundet
                </div>
              )}
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
              <SelectItem value="name-asc">Navn A-Z</SelectItem>
              <SelectItem value="name-desc">Navn Z-A</SelectItem>
              <SelectItem value="role-asc">Rolle</SelectItem>
              <SelectItem value="created_at-desc">Nyeste først</SelectItem>
              <SelectItem value="created_at-asc">Ældste først</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEmployees.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <UserCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterBy !== 'all' || locationFilter !== 'all'
                ? 'Ingen teammedlemmer fundet'
                : 'Ingen teammedlemmer endnu'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterBy !== 'all' || locationFilter !== 'all'
                ? 'Prøv at justere din søgning eller filtre'
                : 'Inviter teammedlemmer for at komme i gang'
              }
            </p>
            {isAdmin && !searchTerm && filterBy === 'all' && (
              <Button onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter første medlem
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEmployees.map((employee) => (
            <Card
              key={employee.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                if (isAdmin) {
                  setSelectedEmployee(employee)
                  setEditEmployeeModalOpen(true)
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary-100 text-primary-600 text-lg">
                      {employee.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="w-full">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {employee.full_name}
                    </h3>
                    <Badge className={getRoleColor(employee.role)}>
                      {employee.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {getRoleLabel(employee.role)}
                    </Badge>
                  </div>

                  <div className="w-full space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </div>

                    {employee.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                  </div>

                  {employee.location_assignments && employee.location_assignments.length > 0 && (
                    <div className="w-full">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Tildelte lokationer ({employee.location_assignments.length})
                      </p>
                      <div className="space-y-1">
                        {employee.location_assignments.slice(0, 2).map((assignment, index) => (
                          <div key={index} className="flex items-center text-xs text-gray-600">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">
                              {assignment.location.title} - {assignment.location.city}
                            </span>
                          </div>
                        ))}
                        {employee.location_assignments.length > 2 && (
                          <p className="text-xs text-gray-500">
                            +{employee.location_assignments.length - 2} flere
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="w-full pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Medlem siden {new Date(employee.created_at).toLocaleDateString('da-DK')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && pendingInvitations.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-slate-900">Afventende invitationer ({pendingInvitations.length})</h3>
            </div>
            <div className="space-y-2">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{invitation.email}</span>
                      <Badge className={getRoleColor(invitation.role)}>
                        {getRoleLabel(invitation.role)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-6">
                      Sendt {new Date(invitation.created_at).toLocaleDateString('da-DK')} •
                      Udløber {new Date(invitation.expires_at).toLocaleDateString('da-DK')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResendInvitation(invitation)}
                      disabled={resendingId === invitation.id}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${resendingId === invitation.id ? 'animate-spin' : ''}`} />
                      {resendingId === invitation.id ? 'Sender...' : 'Send igen'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={resendingId === invitation.id}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <InviteTeamMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onSuccess={() => {
          fetchEmployees()
          if (isAdmin) {
            fetchPendingInvitations()
          }
        }}
      />

      <CreateEmployeeModal
        open={createEmployeeModalOpen}
        onOpenChange={setCreateEmployeeModalOpen}
        onSuccess={() => {
          fetchEmployees()
        }}
      />

      <EditEmployeeModal
        open={editEmployeeModalOpen}
        onOpenChange={setEditEmployeeModalOpen}
        employee={selectedEmployee}
        onSuccess={() => {
          fetchEmployees()
          setSelectedEmployee(null)
        }}
      />
    </div>
  )
}
