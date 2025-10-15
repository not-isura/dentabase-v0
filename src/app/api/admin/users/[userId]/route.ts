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
      scheduleAvailability,
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
    if (role === 'dentist' && (specialization || licenseNumber || clinicAssignment || scheduleAvailability)) {
      await supabase
        .from('doctors')
        .update({
          specialization,
          license_number: licenseNumber,
          room_number: clinicAssignment, // Map clinicAssignment to room_number
          schedule_availability: scheduleAvailability
        })
        .eq('user_id', userId);
    }

    if (role === 'dental_staff' && (designation || assignedDoctor)) {
      await supabase
        .from('staff')
        .update({
          position_title: designation, // Map designation to position_title
          doctor_id: assignedDoctor    // Map assignedDoctor to doctor_id
        })
        .eq('user_id', userId);
    }

    if (role === 'patient' && (address || emergencyContactName || emergencyContactNo)) {
      await supabase
        .from('patient')
        .update({
          address,
          emergency_contact_name: emergencyContactName,
          emergency_contact_no: emergencyContactNo
        })
        .eq('user_id', userId);
    }

    return NextResponse.json({ 
      message: 'User updated successfully',
      userId 
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
