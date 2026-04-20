export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          company_id: string | null
          onboarding_completed: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          company_id?: string | null
          onboarding_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          company_id?: string | null
          onboarding_completed?: boolean
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          notes: string | null
          company_id: string | null
          folder_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          notes?: string | null
          company_id?: string | null
          folder_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          notes?: string | null
          company_id?: string | null
          folder_id?: string | null
          created_at?: string
        }
      }
      customer_folders: {
        Row: {
          id: string
          company_id: string
          name: string
          color: string | null
          created_at: string
          created_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
        }
      }
      customer_contacts: {
        Row: {
          id: string
          customer_id: string
          full_name: string
          email: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          full_name: string
          email: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          full_name?: string
          email?: string
          phone?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          customer_id: string
          title: string
          address: string
          zip: string
          city: string
          country: string
          description: string | null
          locker_number: string | null
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          title: string
          address: string
          zip: string
          city: string
          country: string
          description?: string | null
          locker_number?: string | null
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          title?: string
          address?: string
          zip?: string
          city?: string
          country?: string
          description?: string | null
          locker_number?: string | null
          company_id?: string | null
          created_at?: string
        }
      }
      location_requirements: {
        Row: {
          id: string
          location_id: string
          requirement_text: string
          is_done: boolean
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          requirement_text: string
          is_done?: boolean
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          requirement_text?: string
          is_done?: boolean
          company_id?: string | null
          created_at?: string
        }
      }
      location_images: {
        Row: {
          id: string
          location_id: string
          file_path: string
          file_name: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          mime_type: string | null
          uploaded_by: string
          company_id: string | null
          folder_id: string | null
          is_pinned: boolean
          pinned_at: string | null
          pinned_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          file_path: string
          file_name?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          mime_type?: string | null
          uploaded_by: string
          company_id?: string | null
          folder_id?: string | null
          is_pinned?: boolean
          pinned_at?: string | null
          pinned_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          file_path?: string
          file_name?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          mime_type?: string | null
          uploaded_by?: string
          company_id?: string | null
          folder_id?: string | null
          is_pinned?: boolean
          pinned_at?: string | null
          pinned_by?: string | null
          created_at?: string
        }
      }
      location_activity: {
        Row: {
          id: string
          location_id: string
          actor_id: string
          action_text: string
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          actor_id: string
          action_text: string
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          actor_id?: string
          action_text?: string
          company_id?: string | null
          created_at?: string
        }
      }
      location_assignments: {
        Row: {
          id: string
          location_id: string
          user_id: string
          assigned_by: string
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          user_id: string
          assigned_by: string
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          user_id?: string
          assigned_by?: string
          company_id?: string | null
          created_at?: string
        }
      }
      company_invitations: {
        Row: {
          id: string
          company_id: string
          email: string
          role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          invite_code: string
          invite_type: string
          expires_at: string
          created_by: string
          accepted_at: string | null
          accepted_by: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          email: string
          role?: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          invite_code: string
          invite_type?: string
          expires_at: string
          created_by: string
          accepted_at?: string | null
          accepted_by?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          role?: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          invite_code?: string
          invite_type?: string
          expires_at?: string
          created_by?: string
          accepted_at?: string | null
          accepted_by?: string | null
          status?: string
          created_at?: string
        }
      }
      company_join_codes: {
        Row: {
          id: string
          company_id: string
          code: string
          role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          max_uses: number | null
          current_uses: number
          expires_at: string | null
          is_active: boolean
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          code: string
          role?: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          max_uses?: number | null
          current_uses?: number
          expires_at?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          code?: string
          role?: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          max_uses?: number | null
          current_uses?: number
          expires_at?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
        }
      }
      company_audit_log: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
      }
      location_folder_templates: {
        Row: {
          id: string
          company_id: string
          folder_name: string
          parent_folder_id: string | null
          folder_order: number
          created_at: string
          created_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          folder_name: string
          parent_folder_id?: string | null
          folder_order?: number
          created_at?: string
          created_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          folder_name?: string
          parent_folder_id?: string | null
          folder_order?: number
          created_at?: string
          created_by?: string | null
          updated_at?: string
        }
      }
      location_file_folders: {
        Row: {
          id: string
          location_id: string
          company_id: string
          folder_name: string
          parent_folder_id: string | null
          template_folder_id: string | null
          folder_order: number
          is_template_folder: boolean
          created_at: string
          created_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          company_id: string
          folder_name: string
          parent_folder_id?: string | null
          template_folder_id?: string | null
          folder_order?: number
          is_template_folder?: boolean
          created_at?: string
          created_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          company_id?: string
          folder_name?: string
          parent_folder_id?: string | null
          template_folder_id?: string | null
          folder_order?: number
          is_template_folder?: boolean
          created_at?: string
          created_by?: string | null
          updated_at?: string
        }
      }
      role_permissions: {
        Row: {
          role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          can_manage_company: boolean
          can_manage_team: boolean
          can_manage_customers: boolean
          can_manage_locations: boolean
          can_view_all_locations: boolean
          can_manage_own_profile: boolean
          description: string | null
        }
        Insert: {
          role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          can_manage_company?: boolean
          can_manage_team?: boolean
          can_manage_customers?: boolean
          can_manage_locations?: boolean
          can_view_all_locations?: boolean
          can_manage_own_profile?: boolean
          description?: string | null
        }
        Update: {
          role?: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          can_manage_company?: boolean
          can_manage_team?: boolean
          can_manage_customers?: boolean
          can_manage_locations?: boolean
          can_view_all_locations?: boolean
          can_manage_own_profile?: boolean
          description?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: {
        Args: Record<string, never>
        Returns: string
      }
      user_has_permission: {
        Args: {
          user_id: string
          permission_name: string
        }
        Returns: boolean
      }
      validate_join_code: {
        Args: {
          code_input: string
        }
        Returns: {
          company_id: string
          company_name: string
          role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      user_role: 'admin' | 'customer_responsible' | 'location_responsible' | 'employee'
    }
  }
}