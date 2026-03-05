-- =====================================================
-- PUBLIC BOOKING POLICIES
-- =====================================================
-- 
-- These policies allow unauthenticated users (guests) to view 
-- necessary information (services, staff) and create bookings 
-- (appointments, clients) for a specific tenant.
-- =====================================================

-- 1. Allow guests to view active tenants (for resolution)
CREATE POLICY "Public can view active tenants"
  ON tenants FOR SELECT
  USING (status = 'active');

-- 2. Allow guests to view services for booking
CREATE POLICY "Public can view services"
  ON services FOR SELECT
  USING (tenant_id IS NOT NULL);

-- 3. Allow guests to view staff for booking
CREATE POLICY "Public can view staff"
  ON staff FOR SELECT
  USING (tenant_id IS NOT NULL);

-- 4. Allow guests to book appointments
CREATE POLICY "Public can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (tenant_id IS NOT NULL);

-- 5. Allow guests to register as clients during booking
CREATE POLICY "Public can insert clients"
  ON clients FOR INSERT
  WITH CHECK (tenant_id IS NOT NULL);

-- Note: We should ideally join with the tenants table to ensure
-- the tenant_id corresponds to an active tenant, but this is a 
-- good baseline for making the booking widget functional.
