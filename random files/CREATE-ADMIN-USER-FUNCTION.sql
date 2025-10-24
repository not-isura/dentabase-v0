-- ============================================================
-- ADMIN USER CREATION FUNCTION
-- ============================================================
-- This function creates admin, dentist, dental_staff, or patient users
-- It handles both the users table and role-specific tables (doctors/staff/patient)
-- SECURITY DEFINER allows it to bypass RLS

-- First, create a helper function to check if current user is admin
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;

-- Now create the main user creation function
CREATE OR REPLACE FUNCTION public.create_admin_user(
  p_auth_id UUID,
  p_first_name TEXT,
  p_middle_name TEXT,
  p_last_name TEXT,
  p_phone_number TEXT,
  p_gender user_gender,
  p_role user_role,
  p_status user_status DEFAULT 'active',
  -- Doctor-specific fields (optional)
  p_specialization TEXT DEFAULT NULL,
  p_license_number TEXT DEFAULT NULL,
  p_room_number TEXT DEFAULT NULL,
  -- Staff-specific fields (optional)
  p_position_title TEXT DEFAULT NULL,
  p_assigned_doctor_id UUID DEFAULT NULL,
  -- Patient-specific fields (optional)
  p_address TEXT DEFAULT NULL,
  p_emergency_contact_name TEXT DEFAULT NULL,
  p_emergency_contact_no TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_doctor_id UUID;
  v_result JSON;
BEGIN
  -- 1. Insert into users table
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
    p_role,
    p_status
  )
  RETURNING user_id INTO v_user_id;

  -- 2. If role is 'dentist', insert into doctors table
  IF p_role = 'dentist' THEN
    IF p_specialization IS NULL OR p_license_number IS NULL OR p_room_number IS NULL THEN
      RAISE EXCEPTION 'Dentist role requires specialization, license_number, and room_number';
    END IF;

    INSERT INTO doctors (
      user_id,
      specialization,
      license_number,
      room_number
    )
    VALUES (
      v_user_id,
      p_specialization,
      p_license_number,
      p_room_number
    )
    RETURNING doctor_id INTO v_doctor_id;
  END IF;

  -- 3. If role is 'dental_staff', insert into staff table
  IF p_role = 'dental_staff' THEN
    IF p_position_title IS NULL THEN
      RAISE EXCEPTION 'Dental staff role requires position_title';
    END IF;

    INSERT INTO staff (
      user_id,
      doctor_id,
      position_title
    )
    VALUES (
      v_user_id,
      p_assigned_doctor_id,
      p_position_title
    );
  END IF;

  -- 4. If role is 'patient', insert into patient table
  IF p_role = 'patient' THEN
    IF p_address IS NULL OR p_emergency_contact_name IS NULL OR p_emergency_contact_no IS NULL THEN
      RAISE EXCEPTION 'Patient role requires address, emergency_contact_name, and emergency_contact_no';
    END IF;

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
  END IF;

  -- 5. Return success
  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'role', p_role,
    'message', 'User created successfully'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create user'
    );
END;
$$;

-- Grant execute permission to authenticated users (will be further restricted by API)
GRANT EXECUTE ON FUNCTION public.create_admin_user TO authenticated;

-- ============================================================
-- RLS POLICIES FOR ADMIN ACCESS
-- ============================================================

-- Allow admins to view all users
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
ON users
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Allow admins to insert new users (via function)
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Allow admins to update any user
DROP POLICY IF EXISTS "Admins can update all users" ON users;
CREATE POLICY "Admins can update all users"
ON users
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

-- ============================================================
-- DOCTORS TABLE POLICIES
-- ============================================================

-- Admins can view all doctors
DROP POLICY IF EXISTS "Admins can view all doctors" ON doctors;
CREATE POLICY "Admins can view all doctors"
ON doctors
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert doctors
DROP POLICY IF EXISTS "Admins can insert doctors" ON doctors;
CREATE POLICY "Admins can insert doctors"
ON doctors
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can update doctors
DROP POLICY IF EXISTS "Admins can update doctors" ON doctors;
CREATE POLICY "Admins can update doctors"
ON doctors
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- STAFF TABLE POLICIES
-- ============================================================

-- Admins can view all staff
DROP POLICY IF EXISTS "Admins can view all staff" ON staff;
CREATE POLICY "Admins can view all staff"
ON staff
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert staff
DROP POLICY IF EXISTS "Admins can insert staff" ON staff;
CREATE POLICY "Admins can insert staff"
ON staff
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can update staff
DROP POLICY IF EXISTS "Admins can update staff" ON staff;
CREATE POLICY "Admins can update staff"
ON staff
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- PATIENT TABLE POLICIES
-- ============================================================

-- Admins can view all patients
DROP POLICY IF EXISTS "Admins can view all patients" ON patient;
CREATE POLICY "Admins can view all patients"
ON patient
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert patients
DROP POLICY IF EXISTS "Admins can insert patients" ON patient;
CREATE POLICY "Admins can insert patients"
ON patient
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can update patients
DROP POLICY IF EXISTS "Admins can update patients" ON patient;
CREATE POLICY "Admins can update patients"
ON patient
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Check if function was created successfully
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'create_admin_user';

-- Check policies
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'doctors', 'staff', 'patient')
ORDER BY tablename, policyname;
