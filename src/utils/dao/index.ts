import { IDataAccess } from './types';
import { SupabaseDAO } from './supabaseDAO';
import { LocalStorageDAO } from './localStorageDAO';
import { isSupabaseConfigured } from '../supabase';
// Configuration: Use LocalStorage by default, switch to Supabase when configured
const USE_SUPABASE = false; // Set to false to use LocalStorage by default
// Factory function to get the appropriate DAO
export function getDataAccess(): IDataAccess {
  if (USE_SUPABASE && isSupabaseConfigured()) {
    console.log('Using Supabase for data storage');
    return new SupabaseDAO();
  } else {
    console.log('Using LocalStorage for data storage');
    return new LocalStorageDAO();
  }
}
// Export singleton instance
export const dataAccess = getDataAccess();