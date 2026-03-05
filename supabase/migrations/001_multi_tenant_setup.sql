-- =====================================================
-- MULTI-TENANT DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TENANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- =====================================================
-- 2. TENANT MEMBERS (User-Tenant Relationship)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_status ON tenant_members(status);

-- =====================================================
-- 3. USER PROFILES (Extended user info)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  current_tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get current user's tenant
-- =====================================================
CREATE OR REPLACE FUNCTION auth.current_tenant_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('app.current_tenant_id', TRUE)::UUID,
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- FUNCTION: Set current tenant in session
-- =====================================================
CREATE OR REPLACE FUNCTION set_tenant(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICY: TENANTS
-- =====================================================
-- Simplified RLS for tenants:
-- Users can view tenants they are members of.
-- Owners can update their tenants.
-- Authenticated users can create new tenants.
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (
    id IN (
      SELECT tenant_id 
      FROM tenant_members 
      WHERE user_id = auth.uid() 
        AND status = 'active'
    )
  );

CREATE POLICY "Owners can update tenant"
  ON tenants FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id 
      FROM tenant_members 
      WHERE user_id = auth.uid() 
        AND role = 'owner'
        AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- RLS POLICY: TENANT_MEMBERS
-- =====================================================
-- Simplified RLS for tenant_members:
-- Users can view their own tenant memberships.
-- Admins/Owners can manage (insert, update, delete) members within their tenant.
-- Users can self-insert into a tenant (e.g., during new tenant creation).
CREATE POLICY "Users can view own tenant memberships"
  ON tenant_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage members"
  ON tenant_members FOR INSERT
  WITH CHECK (
    -- Allow owner/admin to invite, OR allow self-insert for new tenant creation
    (
      tenant_id IN (
        SELECT tenant_id 
        FROM tenant_members 
        WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
          AND status = 'active'
      )
    )
    OR (user_id = auth.uid())
  );

CREATE POLICY "Admins can update members"
  ON tenant_members FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

CREATE POLICY "Admins can delete members"
  ON tenant_members FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICY: PROFILES
-- =====================================================
-- Simplified RLS for profiles:
-- Users can view, update, and insert their own profile.
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Auto-create profile on user signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, current_tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    '00000000-0000-0000-0000-000000000001' -- Default to demo tenant
  );

  -- Link to demo tenant as owner for demo purposes
  INSERT INTO public.tenant_members (tenant_id, user_id, role, status)
  VALUES ('00000000-0000-0000-0000-000000000001', NEW.id, 'owner', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists already to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DATA: Demo tenant
-- =====================================================
INSERT INTO tenants (id, name, slug, plan)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Demo Company', 'demo-company', 'starter')
ON CONFLICT (id) DO NOTHING;
