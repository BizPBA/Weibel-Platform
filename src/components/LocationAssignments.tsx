'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, UserMinus, AlertCircle, CheckCircle, ChevronDown, Calendar, Clock, Infinity, Edit3, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Assignment = {
  id: string
  location_id: string
  user_id: string
  assigned_by: string
  created_at: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  expired_at: string | null
  user: {
    full_name: string
    email: string
  }
  assigner: {
    full_name: string
  }
}

type Employee = {
  id: string
  full_name: string
  email: string
  role: string
}

interface LocationAssignmentsProps {
  locationId: string
  locationTitle: string
}

export function LocationAssignments({ locationId, locationTitle }: LocationAssignmentsProps) {
  const { user, profile } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showExpired, setShowExpired] = useState(false)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [isPermanent, setIsPermanent] = useState(true)
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null)
  const [editEndDate, setEditEndDate] = useState<string>('')
  const [comprehensiveEditId, setComprehensiveEditId] = useState<string | null>(null)
  const [comprehensiveEditStartDate, setComprehensiveEditStartDate] = useState<string>('')
  const [comprehensiveEditEndDate, setComprehensiveEditEndDate] = useState<string>('')
  const [comprehensiveEditIsPermanent, setComprehensiveEditIsPermanent] = useState<boolean>(false)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>('')

  useEffect(() => {
    checkAndFetchAssignments()
    fetchEmployees()
  }, [locationId])

  useEffect(() => {
    fetchAssignments()
  }, [showExpired])

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const calculateDaysRemaining = (endDate: string | null): number | null => {
    if (!endDate) return null
    const end = new Date(endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateDaysSinceStart = (startDate: string | null): number => {
    if (!startDate) return 0
    const start = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    const diffTime = today.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getStatusBadge = (assignment: Assignment) => {
    if (!assignment.is_active) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Udløbet</Badge>
    }

    if (!assignment.end_date) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Permanent</Badge>
    }

    const daysRemaining = calculateDaysRemaining(assignment.end_date)
    if (daysRemaining === null) return null

    if (daysRemaining <= 0) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Udløbet</Badge>
    } else if (daysRemaining <= 7) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Udløber snart</Badge>
    } else {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktiv</Badge>
    }
  }

  const getDaysRemainingText = (endDate: string | null): string => {
    if (!endDate) return ''
    const days = calculateDaysRemaining(endDate)
    if (days === null || days < 0) return 'Udløbet'
    if (days === 0) return 'Udløber i dag'
    if (days === 1) return '1 dag tilbage'
    return `${days} dage tilbage`
  }

  const checkAndFetchAssignments = async () => {
    try {
      await supabase.rpc('check_location_expiry', { p_location_id: locationId })
    } catch (error) {
      console.error('Error checking expiry:', error)
    }
    fetchAssignments()
  }

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query with optional filter for active assignments
      let query = supabase
        .from('location_assignments')
        .select('*')
        .eq('location_id', locationId)

      // Filter by active status if not showing expired
      if (!showExpired) {
        query = query.eq('is_active', true)
      }

      const { data: assignmentsData, error: assignmentsError } = await query.order('created_at', { ascending: false })

      if (assignmentsError) throw assignmentsError

      // Fetch user details for each assignment
      const assignmentsWithUsers = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          // Get user details
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', assignment.user_id)
            .single()

          // Get assigner details
          const { data: assignerData, error: assignerError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', assignment.assigned_by)
            .single()

          return {
            ...assignment,
            user: userData || { full_name: 'Unknown User', email: '' },
            assigner: assignerData || { full_name: 'Unknown' }
          }
        })
      )

      setAssignments(assignmentsWithUsers)
    } catch (error: any) {
      console.error('Error fetching assignments:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      if (!profile?.company_id) return

      // Fetch ALL employees from the company regardless of role
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('company_id', profile.company_id)
        .order('full_name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error: any) {
      console.error('Error fetching employees:', error)
    }
  }

  const assignEmployees = async () => {
    if (!user || selectedEmployees.length === 0) return

    // Validate dates
    if (!isPermanent && endDate && startDate && new Date(endDate) < new Date(startDate)) {
      setError('Slutdato skal være efter startdato')
      return
    }

    try {
      setAssigning(true)
      setError(null)
      setSuccess(null)

      // Tjek om nogen af medarbejderne allerede er tildelt
      const alreadyAssigned = selectedEmployees.filter(empId =>
        assignments.some(a => a.user_id === empId && a.is_active)
      )

      if (alreadyAssigned.length > 0) {
        const employeeNames = alreadyAssigned.map(empId =>
          employees.find(e => e.id === empId)?.full_name
        ).join(', ')
        setError(`Følgende medarbejdere er allerede tildelt: ${employeeNames}`)
        return
      }

      // Opret assignments for alle valgte medarbejdere
      const assignmentsToCreate = selectedEmployees.map(empId => ({
        location_id: locationId,
        user_id: empId,
        assigned_by: user.id,
        start_date: startDate || null,
        end_date: isPermanent ? null : (endDate || null),
        is_active: true
      }))

      const { error } = await supabase
        .from('location_assignments')
        .insert(assignmentsToCreate)

      if (error) throw error

      // Log aktivitet for hver tildelt medarbejder
      const activityLogs = selectedEmployees.map(empId => {
        const employee = employees.find(e => e.id === empId)
        let actionText = `Tildelte medarbejder: ${employee?.full_name}`
        if (startDate && !isPermanent && endDate) {
          actionText += ` (Fra: ${formatDate(startDate)} til: ${formatDate(endDate)})`
        } else if (startDate) {
          actionText += ` (Fra: ${formatDate(startDate)} - Permanent)`
        } else {
          actionText += ' (Permanent tilknytning)'
        }
        return {
          location_id: locationId,
          actor_id: user.id,
          action_text: actionText
        }
      })

      await supabase
        .from('location_activity')
        .insert(activityLogs)

      const count = selectedEmployees.length
      setSuccess(`${count} medarbejder${count > 1 ? 'e' : ''} tildelt succesfuldt!`)
      setSelectedEmployees([])
      setStartDate('')
      setEndDate('')
      setIsPermanent(true)
      setIsDropdownOpen(false)
      checkAndFetchAssignments()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error assigning employee:', error)
      setError(error.message)
    } finally {
      setAssigning(false)
    }
  }

  const removeAssignment = async (assignmentId: string, employeeName: string) => {
    if (!user) return

    try {
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('location_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      // Log aktivitet
      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: `Fjernede medarbejder: ${employeeName}`
        })

      setSuccess('Medarbejder fjernet succesfuldt!')
      checkAndFetchAssignments()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error removing assignment:', error)
      setError(error.message)
    }
  }

  const extendAssignment = async (assignmentId: string, employeeName: string) => {
    if (!user || !editEndDate) return

    try {
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('location_assignments')
        .update({ end_date: editEndDate })
        .eq('id', assignmentId)

      if (error) throw error

      // Log aktivitet
      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: `Forlængede tilknytning for ${employeeName} til ${formatDate(editEndDate)}`
        })

      setSuccess('Tilknytning forlænget succesfuldt!')
      setEditingAssignmentId(null)
      setEditEndDate('')
      checkAndFetchAssignments()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error extending assignment:', error)
      setError(error.message)
    }
  }

  const makePermanent = async (assignmentId: string, employeeName: string) => {
    if (!user) return

    try {
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('location_assignments')
        .update({ end_date: null })
        .eq('id', assignmentId)

      if (error) throw error

      // Log aktivitet
      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: `Gjorde ${employeeName}s tilknytning permanent`
        })

      setSuccess('Tilknytning gjort permanent!')
      checkAndFetchAssignments()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error making assignment permanent:', error)
      setError(error.message)
    }
  }

  const updateAssignmentTimeframe = async (assignmentId: string, employeeName: string) => {
    if (!user) return

    // Validate dates
    if (!comprehensiveEditIsPermanent && comprehensiveEditStartDate && comprehensiveEditEndDate) {
      if (new Date(comprehensiveEditEndDate) < new Date(comprehensiveEditStartDate)) {
        setError('Slutdato skal være efter startdato')
        return
      }
    }

    try {
      setError(null)
      setSuccess(null)

      const { error } = await supabase
        .from('location_assignments')
        .update({
          start_date: comprehensiveEditStartDate || null,
          end_date: comprehensiveEditIsPermanent ? null : (comprehensiveEditEndDate || null)
        })
        .eq('id', assignmentId)

      if (error) throw error

      // Log aktivitet
      let actionText = `Opdaterede timeframe for ${employeeName}`
      if (comprehensiveEditStartDate && !comprehensiveEditIsPermanent && comprehensiveEditEndDate) {
        actionText += ` (Fra: ${formatDate(comprehensiveEditStartDate)} til: ${formatDate(comprehensiveEditEndDate)})`
      } else if (comprehensiveEditStartDate && comprehensiveEditIsPermanent) {
        actionText += ` (Fra: ${formatDate(comprehensiveEditStartDate)} - Permanent)`
      } else if (comprehensiveEditIsPermanent) {
        actionText += ' (Ændret til permanent)'
      }

      await supabase
        .from('location_activity')
        .insert({
          location_id: locationId,
          actor_id: user.id,
          action_text: actionText
        })

      setSuccess('Timeframe opdateret!')
      setComprehensiveEditId(null)
      setComprehensiveEditStartDate('')
      setComprehensiveEditEndDate('')
      setComprehensiveEditIsPermanent(false)
      checkAndFetchAssignments()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('Error updating assignment timeframe:', error)
      setError(error.message)
    }
  }

  const startComprehensiveEdit = (assignment: Assignment) => {
    setComprehensiveEditId(assignment.id)
    setComprehensiveEditStartDate(assignment.start_date || '')
    setComprehensiveEditEndDate(assignment.end_date || '')
    setComprehensiveEditIsPermanent(!assignment.end_date)
  }

  const cancelComprehensiveEdit = () => {
    setComprehensiveEditId(null)
    setComprehensiveEditStartDate('')
    setComprehensiveEditEndDate('')
    setComprehensiveEditIsPermanent(false)
  }

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const clearSelection = () => {
    setSelectedEmployees([])
    setEmployeeSearchTerm('')
  }

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'customer_responsible':
        return 'Kunde ansvarlig'
      case 'location_responsible':
        return 'Lokation ansvarlig'
      case 'employee':
        return 'Medarbejder'
      default:
        return role
    }
  }

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'customer_responsible':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'location_responsible':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'employee':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter employees who don't have active assignments
  const availableEmployees = employees.filter(
    emp => !assignments.some(assignment => assignment.user_id === emp.id && assignment.is_active)
  )

  // Filter by search term
  const searchFilteredEmployees = availableEmployees.filter(emp =>
    emp.full_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(employeeSearchTerm.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Tildelte Medarbejdere</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tildel ny medarbejder */}
        <div className="flex space-x-2">
          <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-between">
                {selectedEmployees.length === 0 
                  ? "Vælg medarbejdere at tildele"
                  : `${selectedEmployees.length} medarbejder${selectedEmployees.length > 1 ? 'e' : ''} valgt`
                }
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Vælg medarbejdere</h4>
                  {selectedEmployees.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-xs"
                    >
                      Ryd alle
                    </Button>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Søg medarbejder..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="pl-9 pr-9 text-sm"
                  />
                  {employeeSearchTerm && (
                    <button
                      onClick={() => setEmployeeSearchTerm('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {availableEmployees.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>Alle medarbejdere er allerede tildelt</span>
                  </div>
                ) : searchFilteredEmployees.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-sm text-gray-500">
                    <Search className="w-4 h-4 mr-2" />
                    <span>Ingen medarbejdere matcher søgningen</span>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 px-1">
                      {employeeSearchTerm
                        ? `${searchFilteredEmployees.length} af ${availableEmployees.length} medarbejdere`
                        : `${availableEmployees.length} tilgængelige medarbejdere`
                      }
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchFilteredEmployees.map((employee) => (
                        <div key={employee.id} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                          <Checkbox
                            id={employee.id}
                            checked={selectedEmployees.includes(employee.id)}
                            onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={employee.id}
                            className="text-sm cursor-pointer flex-1"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{employee.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{employee.email}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs shrink-0 ${getRoleBadgeColor(employee.role)}`}
                              >
                                {getRoleLabel(employee.role)}
                              </Badge>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Date Selection */}
                {selectedEmployees.length > 0 && (
                  <div className="pt-3 border-t space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="start-date" className="text-xs">Start dato</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="permanent"
                        checked={isPermanent}
                        onCheckedChange={(checked) => {
                          setIsPermanent(checked as boolean)
                          if (checked) setEndDate('')
                        }}
                      />
                      <label htmlFor="permanent" className="text-sm cursor-pointer">
                        Permanent tilknytning
                      </label>
                    </div>

                    {!isPermanent && (
                      <div className="space-y-2">
                        <Label htmlFor="end-date" className="text-xs">Slut dato</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate || undefined}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            onClick={assignEmployees}
            disabled={assigning || selectedEmployees.length === 0}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {assigning ? 'Tildeler...' : 'Tildel'}
          </Button>
        </div>

        {/* Status beskeder */}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-md">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Filter Toggle */}
        {assignments.length > 0 && (
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Tildelte medarbejdere</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExpired(!showExpired)}
              className="text-xs"
            >
              {showExpired ? 'Skjul udløbne' : 'Vis udløbne'}
            </Button>
          </div>
        )}

        {/* Liste over tildelte medarbejdere */}
        <div className="space-y-2">
          {assignments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              {showExpired ? 'Ingen udløbne tildelinger' : 'Ingen medarbejdere tildelt til denne lokation'}
            </p>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`p-4 rounded-lg border ${
                  !assignment.is_active ? 'bg-gray-100 opacity-60' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{assignment.user.full_name}</p>
                      {getStatusBadge(assignment)}
                    </div>
                    <p className="text-sm text-gray-600">{assignment.user.email}</p>
                  </div>
                  <Button
                    onClick={() => removeAssignment(assignment.id, assignment.user.full_name)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <UserMinus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Timeframe Information */}
                <div className="space-y-1 text-sm">
                  {assignment.start_date && assignment.end_date ? (
                    <>
                      <p className="text-gray-700">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Tilknyttet fra: {formatDate(assignment.start_date)} til {formatDate(assignment.end_date)}
                      </p>
                      {assignment.is_active && (
                        <p className={`font-medium ${
                          calculateDaysRemaining(assignment.end_date)! <= 7 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {getDaysRemainingText(assignment.end_date)} • Tilknyttet i {calculateDaysSinceStart(assignment.start_date)} dage
                        </p>
                      )}
                    </>
                  ) : assignment.start_date ? (
                    <>
                      <p className="text-gray-700">
                        <Infinity className="w-3 h-3 inline mr-1" />
                        Tilknyttet fra: {formatDate(assignment.start_date)} (Permanent)
                      </p>
                      <p className="text-gray-600">
                        Tilknyttet i {calculateDaysSinceStart(assignment.start_date)} dage
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-700">
                      <Infinity className="w-3 h-3 inline mr-1" />
                      Permanent tilknytning
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Tildelt af {assignment.assigner.full_name} • {new Date(assignment.created_at).toLocaleDateString('da-DK')}
                  </p>
                </div>

                {/* Action Buttons for Active Assignments */}
                {assignment.is_active && (
                  <div className="mt-3 pt-3 border-t">
                    {comprehensiveEditId === assignment.id ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Start dato</Label>
                          <Input
                            type="date"
                            value={comprehensiveEditStartDate}
                            onChange={(e) => setComprehensiveEditStartDate(e.target.value)}
                            className="text-sm"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-permanent-${assignment.id}`}
                            checked={comprehensiveEditIsPermanent}
                            onCheckedChange={(checked) => {
                              setComprehensiveEditIsPermanent(checked as boolean)
                              if (checked) {
                                setComprehensiveEditEndDate('')
                              }
                            }}
                          />
                          <label htmlFor={`edit-permanent-${assignment.id}`} className="text-sm cursor-pointer">
                            Permanent tilknytning
                          </label>
                        </div>

                        {!comprehensiveEditIsPermanent && (
                          <div className="space-y-2">
                            <Label className="text-xs">Slut dato</Label>
                            <Input
                              type="date"
                              value={comprehensiveEditEndDate}
                              onChange={(e) => setComprehensiveEditEndDate(e.target.value)}
                              min={comprehensiveEditStartDate || undefined}
                              className="text-sm"
                            />
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => updateAssignmentTimeframe(assignment.id, assignment.user.full_name)}
                            size="sm"
                            className="flex-1"
                          >
                            Gem
                          </Button>
                          <Button
                            onClick={cancelComprehensiveEdit}
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                          >
                            Annuller
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {assignment.end_date ? (
                          <>
                            {editingAssignmentId === assignment.id ? (
                              <div className="flex items-center space-x-2 mb-2">
                                <Input
                                  type="date"
                                  value={editEndDate}
                                  onChange={(e) => setEditEndDate(e.target.value)}
                                  min={assignment.start_date || undefined}
                                  className="text-sm flex-1"
                                />
                                <Button
                                  onClick={() => extendAssignment(assignment.id, assignment.user.full_name)}
                                  size="sm"
                                  disabled={!editEndDate}
                                >
                                  Gem
                                </Button>
                                <Button
                                  onClick={() => {
                                    setEditingAssignmentId(null)
                                    setEditEndDate('')
                                  }}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Annuller
                                </Button>
                              </div>
                            ) : (
                              <div className="flex space-x-2 mb-2">
                                <Button
                                  onClick={() => {
                                    setEditingAssignmentId(assignment.id)
                                    setEditEndDate(assignment.end_date!)
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Forlæng
                                </Button>
                                <Button
                                  onClick={() => makePermanent(assignment.id, assignment.user.full_name)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <Infinity className="w-4 h-4 mr-2" />
                                  Gør permanent
                                </Button>
                              </div>
                            )}
                          </>
                        ) : null}

                        <Button
                          onClick={() => startComprehensiveEdit(assignment)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Rediger timeframe
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {availableEmployees.length === 0 && assignments.length > 0 && (
          <p className="text-gray-500 text-sm text-center">
            Alle medarbejdere er allerede tildelt til denne lokation
          </p>
        )}
      </CardContent>
    </Card>
  )
}