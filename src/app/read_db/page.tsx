import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export default async function ReadDB() {
  const supabase = await createClient();
  
  // Test 1: Check connection status
  const connectionTest = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ URL configured' : '❌ URL missing',
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✅ Key configured' : '❌ Key missing',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Service key configured' : '⚠️ Service key not set',
  };

  // Test 2A: Try to read with anon key (respects RLS)
  const { data: usersWithRLS, error: rlsError } = await supabase.from("users").select();

  // Test 2B: Try to read with service role (bypasses RLS)
  let usersWithoutRLS = null;
  let serviceError = null;
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const result = await adminClient.from("users").select();
    usersWithoutRLS = result.data;
    serviceError = result.error;
  }

  // Test 3: Try to get auth session
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-[hsl(258_46%_25%)]">🔌 Supabase Connection Test</h1>
      
      {/* Connection Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">1️⃣ Environment Variables</h2>
        <div className="space-y-2 text-sm font-mono">
          <div>{connectionTest.url}</div>
          <div>{connectionTest.key}</div>
          <div>{connectionTest.serviceKey}</div>
        </div>
      </div>

      {/* Users Table Test - With RLS */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">2️⃣ Database Query (With RLS - Anon Key)</h2>
        <p className="text-xs text-gray-500 mb-3">This query respects RLS policies. Anonymous users see nothing.</p>
        {rlsError ? (
          <div className="text-red-600 bg-red-50 p-4 rounded">
            <p className="font-semibold">❌ Error:</p>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(rlsError, null, 2)}</pre>
          </div>
        ) : (
          <div className={`${usersWithRLS && usersWithRLS.length > 0 ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'} p-4 rounded`}>
            <p className="font-semibold">
              {usersWithRLS && usersWithRLS.length > 0 
                ? `✅ Found ${usersWithRLS.length} user(s)` 
                : '⚠️ Found 0 users (RLS is blocking)'
              }
            </p>
            <pre className="text-xs mt-2 overflow-auto max-h-64 text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(usersWithRLS, null, 2)}
            </pre>
            {(!usersWithRLS || usersWithRLS.length === 0) && (
              <p className="text-xs mt-3 text-gray-600">
                💡 RLS is working! Anonymous users can't see data. See section 3 below for service role results.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Users Table Test - Without RLS */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">3️⃣ Database Query (Bypass RLS - Service Key)</h2>
        <p className="text-xs text-gray-500 mb-3">This query bypasses RLS. Shows ALL data in table.</p>
        {!process.env.SUPABASE_SERVICE_ROLE_KEY ? (
          <div className="text-blue-600 bg-blue-50 p-4 rounded">
            <p className="font-semibold">ℹ️ Service role key not configured</p>
            <p className="text-xs mt-2">
              To see all users (bypass RLS), add <code className="bg-blue-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to your .env.local file.
            </p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded mt-3 text-xs">
              # Get from: Supabase Dashboard → Settings → API{'\n'}
              SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
            </pre>
          </div>
        ) : serviceError ? (
          <div className="text-red-600 bg-red-50 p-4 rounded">
            <p className="font-semibold">❌ Error:</p>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(serviceError, null, 2)}</pre>
          </div>
        ) : (
          <div className="text-green-600 bg-green-50 p-4 rounded">
            <p className="font-semibold">✅ Success! Found {usersWithoutRLS?.length || 0} users (RLS bypassed)</p>
            <pre className="text-xs mt-2 overflow-auto max-h-64 text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(usersWithoutRLS, null, 2)}
            </pre>
            <p className="text-xs mt-3 text-gray-600">
              🔓 Service role key bypasses RLS - this is the actual data in your table!
            </p>
          </div>
        )}
      </div>

      {/* Auth Test */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">4️⃣ Authentication Test</h2>
        {authError ? (
          <div className="text-red-600 bg-red-50 p-4 rounded">
            <p className="font-semibold">❌ Auth Error:</p>
            <pre className="text-xs mt-2">{JSON.stringify(authError, null, 2)}</pre>
          </div>
        ) : session ? (
          <div className="text-green-600 bg-green-50 p-4 rounded">
            <p className="font-semibold">✅ User logged in</p>
            <pre className="text-xs mt-2 text-gray-700">{JSON.stringify(session.user.email, null, 2)}</pre>
          </div>
        ) : (
          <div className="text-yellow-600 bg-yellow-50 p-4 rounded">
            <p className="font-semibold">⚠️ No active session (not logged in)</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-lg font-semibold mb-3 text-blue-900">📋 What This Means:</h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>✅ <strong>Section 1:</strong> Environment variables are loaded correctly</li>
          <li>⚠️ <strong>Section 2:</strong> Shows 0 users because RLS is active (you're not logged in)</li>
          <li>✅ <strong>Section 3:</strong> Shows ALL users by bypassing RLS with service key</li>
          <li>⚠️ <strong>Section 4:</strong> No session is normal if you haven't implemented login yet</li>
          <li>💡 <strong>To see your 4 users:</strong> Add service key to .env.local and refresh this page</li>
        </ul>
      </div>
    </div>
  );
}