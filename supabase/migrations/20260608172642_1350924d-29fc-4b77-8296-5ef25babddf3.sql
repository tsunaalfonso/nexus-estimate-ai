
-- Prevent any non-tsunaalfonso account from receiving the admin role
CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.role = 'admin' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
    IF v_email IS DISTINCT FROM 'tsunaalfonso@gmail.com' THEN
      RAISE EXCEPTION 'Admin role is restricted to the designated owner account';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_admin_trg ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_admin();

-- Clean up any stray admin rows that don't belong to the owner
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id <> (SELECT id FROM auth.users WHERE email = 'tsunaalfonso@gmail.com');

-- Ensure the owner profile displays the correct name
UPDATE public.profiles
SET full_name = 'Paul Arvy Alfonso'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tsunaalfonso@gmail.com');
