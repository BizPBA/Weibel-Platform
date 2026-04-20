import { useAuth } from '@/components/AuthProvider'
import { Database } from './database.types'

type RoleType = Database['public']['Enums']['user_role']

export const ROLE_LABELS: Record<RoleType, string> = {
  admin: 'Administrator',
  customer_responsible: 'Kunde ansvarlig',
  location_responsible: 'Lokation ansvarlig',
  employee: 'Medarbejder',
}

export const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  admin: 'Fuld adgang til alle funktioner og indstillinger',
  customer_responsible: 'Kan administrere kunder og alle lokationer',
  location_responsible: 'Kan administrere lokationer',
  employee: 'Kan kun se tildelte lokationer',
}

export const ROLE_COLORS: Record<RoleType, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  customer_responsible: 'bg-blue-100 text-blue-800 border-blue-200',
  location_responsible: 'bg-green-100 text-green-800 border-green-200',
  employee: 'bg-gray-100 text-gray-800 border-gray-200',
}

export function useCompany() {
  const { company, profile } = useAuth()

  return {
    company,
    companyId: company?.id || null,
    companyName: company?.name || 'No Company',
    hasCompany: !!company,
  }
}

export function usePermissions() {
  const { hasPermission, isAdmin, canManageCustomers, canManageLocations, canViewAllLocations, profile } = useAuth()

  return {
    hasPermission,
    isAdmin,
    canManageCustomers,
    canManageLocations,
    canViewAllLocations,
    role: profile?.role as RoleType | null,
    roleLabel: profile ? ROLE_LABELS[profile.role as RoleType] : '',
    roleDescription: profile ? ROLE_DESCRIPTIONS[profile.role as RoleType] : '',
    roleColor: profile ? ROLE_COLORS[profile.role as RoleType] : '',
  }
}

export function getRoleLabel(role: RoleType): string {
  return ROLE_LABELS[role]
}

export function getRoleDescription(role: RoleType): string {
  return ROLE_DESCRIPTIONS[role]
}

export function getRoleColor(role: RoleType): string {
  return ROLE_COLORS[role]
}
