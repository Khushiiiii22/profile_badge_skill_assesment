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
      assessments: {
        Row: {
          id: string
          user_id: string
          skill: string
          skill_name: string
          pin_code: string
          school_name: string
          status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'awaiting_approval' | 'completed' | 'cancelled'
          verified_by_assessor: string | null
          rejection_reason: string | null
          verified_at: string | null
          assessment_data: Json | null
          payment_id: string | null
          payment_request_id: string | null
          assessor_id: string | null
          assessment_date: string | null
          score: number | null
          feedback: string | null
          certificate_url: string | null
          badge_url: string | null
          created_at: string
          updated_at: string
          approved: boolean
          approved_by: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          skill: string
          skill_name: string
          pin_code: string
          school_name: string
          status?: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'awaiting_approval' | 'completed' | 'cancelled'
          verified_by_assessor?: string | null
          rejection_reason?: string | null
          verified_at?: string | null
          assessment_data?: Json | null
          payment_id?: string | null
          payment_request_id?: string | null
          assessor_id?: string | null
          assessment_date?: string | null
          score?: number | null
          feedback?: string | null
          certificate_url?: string | null
          badge_url?: string | null
          created_at?: string
          updated_at?: string
          approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          skill?: string
          skill_name?: string
          pin_code?: string
          school_name?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'awaiting_approval' | 'completed' | 'cancelled'
          verified_by_assessor?: string | null
          rejection_reason?: string | null
          verified_at?: string | null
          assessment_data?: Json | null
          payment_id?: string | null
          payment_request_id?: string | null
          assessor_id?: string | null
          assessment_date?: string | null
          score?: number | null
          feedback?: string | null
          certificate_url?: string | null
          badge_url?: string | null
          created_at?: string
          updated_at?: string
          approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          name: string | null
          phone: string | null
          age: number | null
          assessment_access: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          name?: string | null
          phone?: string | null
          age?: number | null
          assessment_access?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          name?: string | null
          phone?: string | null
          age?: number | null
          assessment_access?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      assessor_requests: {
        Row: {
          id: string
          user_id: string
          status: string
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role: 'admin' | 'staff' | 'employee' | 'student' | 'assessor'
          created_at: string
        }
        Insert: {
          user_id: string
          role?: 'admin' | 'staff' | 'employee' | 'student' | 'assessor'
          created_at?: string
        }
        Update: {
          user_id?: string
          role?: 'admin' | 'staff' | 'employee' | 'student' | 'assessor'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}