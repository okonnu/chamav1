import { IDataAccess } from './types';
import { SupabaseDAO } from './supabaseDAO';

// Export singleton instance - Supabase only
export const dataAccess = new SupabaseDAO();