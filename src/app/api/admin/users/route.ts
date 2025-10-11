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

// GET - Fetch all users (RLS-based: only admins can see all users)
export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query - RLS will automatically restrict to admins
    let query = supabase
      .from('users')
      .select(`
        user_id,
        auth_id,
        email,
        first_name,
        middle_name,
        last_name,
        phone_number,
        gender,
        role,
        status,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      // Search by first name, last name, OR email
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    // If RLS blocks the query (user is not admin), return 403
    // Empty results (data.length === 0) are valid - just no matches for the filter
    if (error) {
      console.error('RLS restriction or database error:', error);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Return users (empty array if no matches)
    return NextResponse.json({ users: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user (RLS-based: only admins can delete users)
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First, get the user's auth_id and role (RLS will block if not admin)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('auth_id, role')
      .eq('user_id', userId)
      .single();

    // If RLS blocks the query (user is not admin), return 403
    if (userError || !userData) {
      console.error('RLS restriction or user not found:', userError);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required or user not found' },
        { status: 403 }
      );
    }

    // Delete from role-specific tables first (RLS allows admins)
    if (userData.role === 'dentist') {
      await supabase.from('doctors').delete().eq('user_id', userId);
    } else if (userData.role === 'dental_staff') {
      await supabase.from('staff').delete().eq('user_id', userId);
    } else if (userData.role === 'patient') {
      await supabase.from('patient').delete().eq('user_id', userId);
    }

    // Delete from users table (RLS allows admins)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting user from users table:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Delete from Supabase Auth (requires admin client)
    // This is the ONLY operation that needs service role key
    if (userData.auth_id) {
      await supabaseAdmin.auth.admin.deleteUser(userData.auth_id);
    }

    return NextResponse.json({ 
      message: 'User deleted successfully',
      deletedUserId: userId 
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/users:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
