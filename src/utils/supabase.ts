import { createClient } from '@supabase/supabase-js';
// Supabase configuration - Add your credentials here to enable Supabase
// Leave empty to use LocalStorage instead
const supabaseUrl = "https://zthoxpevzbsuymwrnngt.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0aG94cGV2emJzdXltd3Jubmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTYxMzcsImV4cCI6MjA3ODQzMjEzN30.Wrbq1W3uswg-Wv5M4P7N7_th-1hPTykqyb-_DdW8bIw"
// Create a mock client if credentials aren't provided
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};
// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_date: string;
          club_name: string;
          contribution_amount: number;
          frequency: string;
          current_period: number;
          total_periods: number;
          number_of_cycles: number;
          periods_per_cycle: number;
          start_date: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by: string;
          created_date?: string;
          club_name: string;
          contribution_amount: number;
          frequency: string;
          current_period: number;
          total_periods: number;
          number_of_cycles: number;
          periods_per_cycle: number;
          start_date: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_date?: string;
          club_name?: string;
          contribution_amount?: number;
          frequency?: string;
          current_period?: number;
          total_periods?: number;
          number_of_cycles?: number;
          periods_per_cycle?: number;
          start_date?: string;
        };
      };
      group_memberships: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_date: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_date?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: string;
          joined_date?: string;
        };
      };
      members: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          email: string;
          phone: string | null;
          joined_date: string;
          has_received: boolean;
          missed_payments: number;
          scheduled_period: number;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          email: string;
          phone?: string | null;
          joined_date?: string;
          has_received?: boolean;
          missed_payments?: number;
          scheduled_period: number;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          joined_date?: string;
          has_received?: boolean;
          missed_payments?: number;
          scheduled_period?: number;
        };
      };
      payments: {
        Row: {
          id: string;
          group_id: string;
          member_id: string;
          amount: number;
          date: string;
          period: number;
        };
        Insert: {
          id?: string;
          group_id: string;
          member_id: string;
          amount: number;
          date: string;
          period: number;
        };
        Update: {
          id?: string;
          group_id?: string;
          member_id?: string;
          amount?: number;
          date?: string;
          period?: number;
        };
      };
      periods: {
        Row: {
          id: string;
          group_id: string;
          number: number;
          recipient_id: string;
          start_date: string;
          end_date: string;
          total_collected: number;
          status: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          number: number;
          recipient_id: string;
          start_date: string;
          end_date: string;
          total_collected: number;
          status: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          number?: number;
          recipient_id?: string;
          start_date?: string;
          end_date?: string;
          total_collected?: number;
          status?: string;
        };
      };
      join_requests: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          user_name: string;
          user_email: string;
          message: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          user_name: string;
          user_email: string;
          message?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          user_name?: string;
          user_email?: string;
          message?: string | null;
          status?: string;
          created_at?: string;
        };
      };
    };
  };
}