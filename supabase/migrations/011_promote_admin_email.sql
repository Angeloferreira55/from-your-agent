-- Promote angelo@from-your-agent.com to admin role
-- This ensures the admin email has proper access even if the account already exists.

UPDATE public.agent_profiles
SET role = 'admin'
WHERE email = 'angelo@from-your-agent.com'
  AND role != 'admin';

-- Update the handle_new_user trigger to auto-assign admin role for known admin emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agent_profiles (user_id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    CASE WHEN NEW.email = 'angelo@from-your-agent.com' THEN 'admin' ELSE 'agent' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
