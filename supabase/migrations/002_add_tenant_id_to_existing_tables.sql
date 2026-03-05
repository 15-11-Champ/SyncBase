-- =====================================================
-- ADD tenant_id TO ALL EXISTING TABLES
-- Run this in Supabase SQL Editor AFTER 001_multi_tenant_setup.sql
-- =====================================================
-- 
-- This migration adds a tenant_id column to each existing table,
-- backfills it with the demo tenant ID, enables RLS, and creates
-- policies for tenant-scoped data access.
--
-- IMPORTANT: Run 001_multi_tenant_setup.sql FIRST to create the
-- tenants, tenant_members, profiles tables and helper functions.
-- =====================================================

-- Demo tenant ID (from seed data in 001)
-- Change this if you used a different tenant ID
DO $$ 
DECLARE
  demo_tenant UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'appointments' AND column_name = 'tenant_id'
) THEN
  ALTER TABLE appointments ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  UPDATE appointments SET tenant_id = demo_tenant WHERE tenant_id IS NULL;
  ALTER TABLE appointments ALTER COLUMN tenant_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
END IF;

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'clients' AND column_name = 'tenant_id'
) THEN
  ALTER TABLE clients ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  UPDATE clients SET tenant_id = demo_tenant WHERE tenant_id IS NULL;
  ALTER TABLE clients ALTER COLUMN tenant_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
END IF;

-- =====================================================
-- STAFF TABLE
-- =====================================================
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'staff' AND column_name = 'tenant_id'
) THEN
  ALTER TABLE staff ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  UPDATE staff SET tenant_id = demo_tenant WHERE tenant_id IS NULL;
  ALTER TABLE staff ALTER COLUMN tenant_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);
END IF;

-- =====================================================
-- INVOICES TABLE
-- =====================================================
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'invoices' AND column_name = 'tenant_id'
) THEN
  ALTER TABLE invoices ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  UPDATE invoices SET tenant_id = demo_tenant WHERE tenant_id IS NULL;
  ALTER TABLE invoices ALTER COLUMN tenant_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
END IF;

-- =====================================================
-- FINANCE TABLE
-- =====================================================
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'finance' AND column_name = 'tenant_id'
) THEN
  ALTER TABLE finance ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  UPDATE finance SET tenant_id = demo_tenant WHERE tenant_id IS NULL;
  ALTER TABLE finance ALTER COLUMN tenant_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_finance_tenant ON finance(tenant_id);
END IF;

-- =====================================================
-- SERVICES TABLE
-- =====================================================
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'services' AND column_name = 'tenant_id'
) THEN
  ALTER TABLE services ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  UPDATE services SET tenant_id = demo_tenant WHERE tenant_id IS NULL;
  ALTER TABLE services ALTER COLUMN tenant_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
END IF;

-- =====================================================
-- STAFF_PAYROLL TABLE
-- =====================================================
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'staff_payroll' AND column_name = 'tenant_id'
) THEN
  ALTER TABLE staff_payroll ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  UPDATE staff_payroll SET tenant_id = demo_tenant WHERE tenant_id IS NULL;
  ALTER TABLE staff_payroll ALTER COLUMN tenant_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_staff_payroll_tenant ON staff_payroll(tenant_id);
END IF;

-- =====================================================
-- STAFF_ATTENDANCE TABLE
-- =====================================================
IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'staff_attendance' AND column_name = 'tenant_id'
) THEN
  ALTER TABLE staff_attendance ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
  UPDATE staff_attendance SET tenant_id = demo_tenant WHERE tenant_id IS NULL;
  ALTER TABLE staff_attendance ALTER COLUMN tenant_id SET NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_staff_attendance_tenant ON staff_attendance(tenant_id);
END IF;

END $$;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: APPOINTMENTS
-- =====================================================
CREATE POLICY "Tenant members can view appointments"
  ON appointments FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can update appointments"
  ON appointments FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can delete appointments"
  ON appointments FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES: CLIENTS
-- =====================================================
CREATE POLICY "Tenant members can view clients"
  ON clients FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can insert clients"
  ON clients FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can update clients"
  ON clients FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can delete clients"
  ON clients FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES: STAFF
-- =====================================================
CREATE POLICY "Tenant members can view staff"
  ON staff FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can insert staff"
  ON staff FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can update staff"
  ON staff FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can delete staff"
  ON staff FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES: INVOICES
-- =====================================================
CREATE POLICY "Tenant members can view invoices"
  ON invoices FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can update invoices"
  ON invoices FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can delete invoices"
  ON invoices FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES: FINANCE
-- =====================================================
CREATE POLICY "Tenant members can view finance"
  ON finance FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can insert finance"
  ON finance FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can update finance"
  ON finance FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can delete finance"
  ON finance FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES: SERVICES
-- =====================================================
CREATE POLICY "Tenant members can view services"
  ON services FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can insert services"
  ON services FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can update services"
  ON services FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can delete services"
  ON services FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES: STAFF_PAYROLL
-- =====================================================
CREATE POLICY "Tenant members can view staff_payroll"
  ON staff_payroll FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can insert staff_payroll"
  ON staff_payroll FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can update staff_payroll"
  ON staff_payroll FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can delete staff_payroll"
  ON staff_payroll FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- =====================================================
-- RLS POLICIES: STAFF_ATTENDANCE
-- =====================================================
CREATE POLICY "Tenant members can view staff_attendance"
  ON staff_attendance FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can insert staff_attendance"
  ON staff_attendance FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant members can update staff_attendance"
  ON staff_attendance FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Tenant admins can delete staff_attendance"
  ON staff_attendance FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );
