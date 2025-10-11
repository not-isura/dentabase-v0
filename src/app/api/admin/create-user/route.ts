import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Initialize Supabase Admin client (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Secret key with admin privileges
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the requesting user is an admin
    const supabase = await createServerClient();

    const {
      data: { user: requestingUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !requestingUser) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Check if requesting user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', requestingUser.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const {
      email,
      tempPassword,
      firstName,
      middleName,
      lastName,
      phoneNumber,
      gender,
      role,
      status,
      // Doctor-specific
      specialization,
      licenseNumber,
      clinicAssignment, // room_number
      // Staff-specific
      designation, // position_title
      assignedDoctor, // doctor_id
      // Patient-specific
      address,
      emergencyContactName,
      emergencyContactNo,
    } = body;

    // 3. Validate required fields
    if (!email || !tempPassword || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 4. Validate role-specific requirements
    if (role === 'dentist') {
      if (!specialization || !licenseNumber || !clinicAssignment) {
        return NextResponse.json(
          {
            error:
              'Dentist role requires specialization, license number, and room assignment',
          },
          { status: 400 }
        );
      }
    }

    if (role === 'dental_staff') {
      if (!designation) {
        return NextResponse.json(
          { error: 'Dental staff role requires position/designation' },
          { status: 400 }
        );
      }
    }

    if (role === 'patient') {
      if (!address || !emergencyContactName || !emergencyContactNo) {
        return NextResponse.json(
          {
            error:
              'Patient role requires address, emergency contact name, and emergency contact number',
          },
          { status: 400 }
        );
      }
    }

    // 5. Create auth user using Supabase Admin API
    const {
      data: authData,
      error: createAuthError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
      },
    });

    if (createAuthError || !authData.user) {
      console.error('Error creating auth user:', createAuthError);
      return NextResponse.json(
        {
          error: createAuthError?.message || 'Failed to create authentication user',
        },
        { status: 500 }
      );
    }

    // 6. Call database function to create user profile and role-specific data
    const { data: dbResult, error: dbError } = await supabaseAdmin.rpc(
      'create_admin_user',
      {
        p_auth_id: authData.user.id,
        p_first_name: firstName,
        p_middle_name: middleName || null,
        p_last_name: lastName,
        p_phone_number: phoneNumber || null,
        p_gender: gender || 'unspecified',
        p_role: role,
        p_status: status || 'active',
        // Doctor fields
        p_specialization: role === 'dentist' ? specialization : null,
        p_license_number: role === 'dentist' ? licenseNumber : null,
        p_room_number: role === 'dentist' ? clinicAssignment : null,
        // Staff fields
        p_position_title: role === 'dental_staff' ? designation : null,
        p_assigned_doctor_id: role === 'dental_staff' && assignedDoctor ? assignedDoctor : null,
        // Patient fields
        p_address: role === 'patient' ? address : null,
        p_emergency_contact_name: role === 'patient' ? emergencyContactName : null,
        p_emergency_contact_no: role === 'patient' ? emergencyContactNo : null,
      }
    );

    if (dbError) {
      console.error('Database error:', dbError);
      
      // If database insert fails, delete the auth user to keep things consistent
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: dbError.message || 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Check if the function returned an error
    if (dbResult && typeof dbResult === 'object' && 'success' in dbResult && !dbResult.success) {
      // Delete auth user if database function failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: dbResult.error || 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // 7. Return success
    return NextResponse.json({
      success: true,
      message: `${role} account created successfully`,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in create-user API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
