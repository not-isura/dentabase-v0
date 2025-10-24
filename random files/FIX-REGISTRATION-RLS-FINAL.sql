-- SOLUTION: Create a Database Function to Handle User Registration
-- This function runs with SECURITY DEFINER, bypassing RLS

-- Drop existing policies first (they won't work for unverified users)
DROP POLICY IF EXISTS "Allow authenticated users to insert their own user record" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own patient record" ON patient;

-- Create a secure function that can insert user data during registration
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_auth_id UUID,
  p_first_name TEXT,
  p_middle_name TEXT,
  p_last_name TEXT,
  p_phone_number TEXT,
  p_gender user_gender,
  p_address TEXT,
  p_emergency_contact_name TEXT,
  p_emergency_contact_no TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Insert into users table
  INSERT INTO users (
    auth_id,
    first_name,
    middle_name,
    last_name,
    phone_number,
    gender,
    role,
    status
  )
  VALUES (
    p_auth_id,
    p_first_name,
    p_middle_name,
    p_last_name,
    p_phone_number,
    p_gender,
    'patient',
    'active'
  )
  RETURNING user_id INTO v_user_id;

  -- Insert into patient table
  INSERT INTO patient (
    user_id,
    address,
    emergency_contact_name,
    emergency_contact_no
  )
  VALUES (
    v_user_id,
    p_address,
    p_emergency_contact_name,
    p_emergency_contact_no
  );

  -- Return success with user_id
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'User profile created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create user profile'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon;

-- Keep the existing SELECT/UPDATE policies (these work fine for logged-in users)
CREATE POLICY "Users can view own data"
ON users
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

CREATE POLICY "Users can update own data"
ON users
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Patients can view own data"
ON patient
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM users WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Patients can update own data"
ON patient
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT user_id FROM users WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT user_id FROM users WHERE auth_id = auth.uid()
  )
);

-- Verify the function was created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_user_profile';
