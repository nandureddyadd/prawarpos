import { createClient, SupabaseClient, Session, User as SupabaseAuthUser } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

// Check if valid URL and Key are provided
export const isSupabaseConfigured: boolean = Boolean(
  rawUrl &&
  rawUrl.startsWith('https://') &&
  !rawUrl.includes('your-project') &&
  rawKey &&
  rawKey.length > 20 &&
  !rawKey.includes('your-publishable')
);

// Fallback URL to prevent Supabase constructor crash when variables are not yet injected
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-project.supabase.co';
const supabasePublishableKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'prawar_supabase_auth_session',
  },
});

export interface SupabaseProfile {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseRestaurant {
  id: string;
  name: string;
  legal_name?: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  owner_id: string;
  gst_number?: string;
  fssai_number?: string;
  created_at?: string;
}

export interface SupabaseRestaurantMember {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'staff';
  branch_id?: string;
  pin?: string;
  active: boolean;
  created_at?: string;
}

export type { Session, SupabaseAuthUser };
