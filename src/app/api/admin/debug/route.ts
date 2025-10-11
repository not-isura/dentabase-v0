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

// Debug endpoint to check user auth and database records
export async function GET(request: Request) {
  try {
    // Get current authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not logged in',
        authError: authError?.message
      });
    }

    // Check database record
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      auth: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at,
      },
      database: userData || null,
      dbError: dbError?.message || null,
      match: userData?.user_id === user.id,
      isAdmin: userData?.role === 'admin'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Server error',
      message: error.message
    });
  }
}
