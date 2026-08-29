-- ==============================================================================
-- PRAWARPOS RESTAURANT MANAGEMENT SYSTEM — SUPABASE PRODUCTION DATABASE SCHEMA
-- ==============================================================================
-- Features:
-- 1. Automatic profile provisioning on signup via auth.users triggers
-- 2. Multi-tenant restaurant and branch isolation
-- 3. Role-Based Access Control (RBAC): OWNER, MANAGER, CASHIER, WAITER, STAFF
-- 4. Row Level Security (RLS) policies enforcing restaurant isolation
-- 5. Safe indexing for high-speed POS operations
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  tagline TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  gst_number TEXT,
  fssai_number TEXT,
  logo_url TEXT,
  currency_symbol TEXT DEFAULT '₹',
  currency_code TEXT DEFAULT 'INR',
  invoice_prefix TEXT DEFAULT 'INV',
  cgst_rate NUMERIC DEFAULT 2.5,
  sgst_rate NUMERIC DEFAULT 2.5,
  service_charge_rate NUMERIC DEFAULT 5.0,
  enable_service_charge BOOLEAN DEFAULT false,
  enable_round_off BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- Safe migration for existing installations
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 3. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_main BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, code)
);

-- 4. RESTAURANT MEMBERS / STAFF TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'cashier', 'waiter', 'staff')),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  pin TEXT DEFAULT '1234',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_members ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an active member of a restaurant
CREATE OR REPLACE FUNCTION public.is_member_of_restaurant(target_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_id = target_restaurant_id
      AND user_id = auth.uid()
      AND active = true
  );
$$;

-- Helper function to check if current user is owner/manager of a restaurant
CREATE OR REPLACE FUNCTION public.is_manager_of_restaurant(target_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurant_members
    WHERE restaurant_id = target_restaurant_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
      AND active = true
  );
$$;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view profiles in their restaurant" ON public.profiles;
CREATE POLICY "Users can view profiles in their restaurant"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.restaurant_members rm1
      JOIN public.restaurant_members rm2 ON rm1.restaurant_id = rm2.restaurant_id
      WHERE rm1.user_id = auth.uid()
        AND rm2.user_id = public.profiles.id
        AND rm1.active = true
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RESTAURANTS POLICIES
DROP POLICY IF EXISTS "Members can view their restaurant" ON public.restaurants;
CREATE POLICY "Members can view their restaurant"
  ON public.restaurants
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR public.is_member_of_restaurant(id)
  );

DROP POLICY IF EXISTS "Owners can update their restaurant" ON public.restaurants;
CREATE POLICY "Owners can update their restaurant"
  ON public.restaurants
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR public.is_manager_of_restaurant(id)
  );

DROP POLICY IF EXISTS "Authenticated users can create a restaurant" ON public.restaurants;
CREATE POLICY "Authenticated users can create a restaurant"
  ON public.restaurants
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- BRANCHES POLICIES
DROP POLICY IF EXISTS "Members can view restaurant branches" ON public.branches;
CREATE POLICY "Members can view restaurant branches"
  ON public.branches
  FOR SELECT
  USING (public.is_member_of_restaurant(restaurant_id));

DROP POLICY IF EXISTS "Managers can manage restaurant branches" ON public.branches;
CREATE POLICY "Managers can manage restaurant branches"
  ON public.branches
  FOR ALL
  USING (public.is_manager_of_restaurant(restaurant_id));

-- RESTAURANT MEMBERS POLICIES
DROP POLICY IF EXISTS "Members can view staff in same restaurant" ON public.restaurant_members;
CREATE POLICY "Members can view staff in same restaurant"
  ON public.restaurant_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_member_of_restaurant(restaurant_id)
  );

DROP POLICY IF EXISTS "Managers can insert/update staff in same restaurant" ON public.restaurant_members;
CREATE POLICY "Managers can insert/update staff in same restaurant"
  ON public.restaurant_members
  FOR ALL
  USING (
    public.is_manager_of_restaurant(restaurant_id)
    OR (user_id = auth.uid())
  );

-- ==============================================================================
-- AUTOMATIC TRIGGER FOR AUTH SIGNUP → PROFILE CREATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_name TEXT;
  new_restaurant_name TEXT;
  new_restaurant_id UUID;
  new_branch_id UUID;
  user_role TEXT;
BEGIN
  new_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  new_restaurant_name := new.raw_user_meta_data->>'restaurant_name';
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'owner');

  -- 1. Insert Profile
  INSERT INTO public.profiles (id, auth_user_id, name, email)
  VALUES (new.id, new.id, new_name, new.email)
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, email = EXCLUDED.email;

  -- 2. If new owner registering a restaurant
  IF new_restaurant_name IS NOT NULL AND length(trim(new_restaurant_name)) > 0 THEN
    -- Create restaurant
    INSERT INTO public.restaurants (name, owner_id, email)
    VALUES (new_restaurant_name, new.id, new.email)
    RETURNING id INTO new_restaurant_id;

    -- Create default branch
    INSERT INTO public.branches (restaurant_id, name, code, is_main)
    VALUES (new_restaurant_id, 'Main Branch', 'HQ', true)
    RETURNING id INTO new_branch_id;

    -- Create owner member entry
    INSERT INTO public.restaurant_members (restaurant_id, user_id, role, branch_id, active)
    VALUES (new_restaurant_id, new.id, 'owner', new_branch_id, true);
  END IF;

  RETURN new;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_restaurant_members_user_id ON public.restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_restaurant_id ON public.restaurant_members(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_branches_restaurant_id ON public.branches(restaurant_id);
