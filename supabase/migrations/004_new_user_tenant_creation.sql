-- =====================================================
-- Create a tenant for each new user on signup
-- Replaces the previous trigger that linked users to a demo tenant.
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  tenant_name TEXT;
  tenant_slug TEXT;
BEGIN
  -- Unique slug from user id (no collision possible)
  tenant_slug := 'org-' || REPLACE(NEW.id::TEXT, '-', '');
  tenant_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(NEW.email, '@', 1),
    'My Organization'
  );

  -- Create a dedicated tenant for this user
  INSERT INTO public.tenants (name, slug, plan, status)
  VALUES (tenant_name, tenant_slug, 'free', 'active')
  RETURNING id INTO new_tenant_id;

  -- Add user as owner of the new tenant
  INSERT INTO public.tenant_members (tenant_id, user_id, role, status, joined_at)
  VALUES (new_tenant_id, NEW.id, 'owner', 'active', NOW());

  -- Create profile with current_tenant_id set to the new tenant
  INSERT INTO public.profiles (id, full_name, current_tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    new_tenant_id
  );

  RETURN NEW;
END;
$$;

-- Trigger is already created in 001; no need to recreate unless missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
