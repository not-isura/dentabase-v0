import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Fetch single user with all details (RLS-based: only admins can view)
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Create server client (respects RLS policies)
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userId = params.userId;

    // Get user basic info - RLS will block if not admin
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If RLS blocks the query (user is not admin), return 403
    if (userError || !targetUser) {
      console.error('RLS restriction or user not found:', userError);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required or user not found' },
        { status: 403 }
      );
    }

    // Get role-specific data - RLS will block if not admin
    let roleData = null;
    if (targetUser.role === 'dentist') {
      const { data } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();
      // Map room_number to clinicAssignment for frontend compatibility
      if (data) {
        roleData = {
          ...data,
          clinic_assignment: data.room_number
        };
      } else {
        roleData = data;
      }
    } else if (targetUser.role === 'dental_staff') {
      const { data } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single();
      // Map database columns to frontend field names
      if (data) {
        roleData = {
          ...data,
          designation: data.position_title,
          assigned_doctor: data.doctor_id
        };
      } else {
        roleData = data;
      }
    } else if (targetUser.role === 'patient') {
      const { data } = await supabase
        .from('patient')
        .select('*')
        .eq('user_id', userId)
        .single();
      roleData = data;
    }

    return NextResponse.json({ 
      user: {
        ...targetUser,
        roleData
      }
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update user (RLS-based: only admins can update users)
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Create server client (respects RLS policies)
    const supabase = await createServerClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userId = params.userId;
    const body = await request.json();

    const {
      firstName,
      middleName,
      lastName,
      phoneNumber,
      gender,
      status,
      role,
      // Role-specific fields
      specialization,
      licenseNumber,
  clinicAssignment,
      designation,
      assignedDoctor,
      address,
      emergencyContactName,
      emergencyContactNo
    } = body;

    // Update users table - RLS will block if not admin
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        phone_number: phoneNumber,
        gender,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // If RLS blocks the update (user is not admin), return 403
    if (updateError) {
      console.error('RLS restriction or update error:', updateError);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required or update failed' },
        { status: 403 }
      );
    }

    // Update role-specific tables - RLS will block if not admin
    const hasDentistField =
      Object.prototype.hasOwnProperty.call(body, 'specialization') ||
      Object.prototype.hasOwnProperty.call(body, 'licenseNumber') ||
      Object.prototype.hasOwnProperty.call(body, 'clinicAssignment');

    if (role === 'dentist' && hasDentistField) {
      const doctorUpdates: Record<string, string | null | undefined> = {};
      if (Object.prototype.hasOwnProperty.call(body, 'specialization')) {
        doctorUpdates.specialization = specialization ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'licenseNumber')) {
        doctorUpdates.license_number = licenseNumber ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'clinicAssignment')) {
        doctorUpdates.room_number = clinicAssignment ?? null;
      }

      if (Object.keys(doctorUpdates).length > 0) {
        const { error: doctorUpdateError } = await supabase
          .from('doctors')
          .update(doctorUpdates)
          .eq('user_id', userId);

        if (doctorUpdateError) {
          console.error('Error updating doctor details:', doctorUpdateError);
          return NextResponse.json(
            { error: 'Failed to update doctor information' },
            { status: 500 }
          );
        }
      }
    }

    const hasStaffField =
      Object.prototype.hasOwnProperty.call(body, 'designation') ||
      Object.prototype.hasOwnProperty.call(body, 'assignedDoctor');

    if (role === 'dental_staff' && hasStaffField) {
      const staffUpdates: Record<string, string | null | undefined> = {};
      if (Object.prototype.hasOwnProperty.call(body, 'designation')) {
        staffUpdates.position_title = designation ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'assignedDoctor')) {
        staffUpdates.doctor_id = assignedDoctor ?? null;
      }

      if (Object.keys(staffUpdates).length > 0) {
        const { error: staffUpdateError } = await supabase
          .from('staff')
          .update(staffUpdates)
          .eq('user_id', userId);

        if (staffUpdateError) {
          console.error('Error updating staff details:', staffUpdateError);
          return NextResponse.json(
            { error: 'Failed to update staff information' },
            { status: 500 }
          );
        }
      }
    }

    const hasPatientField =
      Object.prototype.hasOwnProperty.call(body, 'address') ||
      Object.prototype.hasOwnProperty.call(body, 'emergencyContactName') ||
      Object.prototype.hasOwnProperty.call(body, 'emergencyContactNo');

    if (role === 'patient' && hasPatientField) {
      const patientUpdates: Record<string, string | null | undefined> = {};
      if (Object.prototype.hasOwnProperty.call(body, 'address')) {
        patientUpdates.address = address ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'emergencyContactName')) {
        patientUpdates.emergency_contact_name = emergencyContactName ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'emergencyContactNo')) {
        patientUpdates.emergency_contact_no = emergencyContactNo ?? null;
      }

      if (Object.keys(patientUpdates).length > 0) {
        const { error: patientUpdateError } = await supabase
          .from('patient')
          .update(patientUpdates)
          .eq('user_id', userId);

        if (patientUpdateError) {
          console.error('Error updating patient details:', patientUpdateError);
          return NextResponse.json(
            { error: 'Failed to update patient information' },
            { status: 500 }
          );
        }
      }
    }

    // Fetch updated user and role-specific data to return to client
    const { data: updatedUser, error: updatedUserError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (updatedUserError || !updatedUser) {
      console.error('Error fetching updated user:', updatedUserError);
      return NextResponse.json(
        { error: 'Failed to retrieve updated user information' },
        { status: 500 }
      );
    }

    let updatedRoleData: any = null;
    if (updatedUser.role === 'dentist') {
      const { data: doctorData, error: doctorFetchError } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (doctorFetchError) {
        console.error('Error fetching updated doctor data:', doctorFetchError);
      } else if (doctorData) {
        updatedRoleData = {
          ...doctorData,
          clinic_assignment: doctorData.room_number,
        };
      }
    } else if (updatedUser.role === 'dental_staff') {
      const { data: staffData, error: staffFetchError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (staffFetchError) {
        console.error('Error fetching updated staff data:', staffFetchError);
      } else if (staffData) {
        updatedRoleData = {
          ...staffData,
          designation: staffData.position_title,
          assigned_doctor: staffData.doctor_id,
        };
      }
    } else if (updatedUser.role === 'patient') {
      const { data: patientData, error: patientFetchError } = await supabase
        .from('patient')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (patientFetchError) {
        console.error('Error fetching updated patient data:', patientFetchError);
      } else {
        updatedRoleData = patientData;
      }
    }

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: {
        ...updatedUser,
        roleData: updatedRoleData,
      },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
