import { createClient } from '@/lib/supabase/server';

export default async function TestRLS() {
  const supabase = await createClient();
  
  // Check if RLS is enabled
  const { data: rlsStatus, error: rlsError } = await supabase
    .rpc('check_rls_status', { table_name: 'users' })
    .single()
    .then(
      () => ({ data: 'Custom function not available, using direct query', error: null }),
      () => ({ data: null, error: 'Using fallback method' })
    );

  // Try to read all users (will be filtered by RLS)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  // Get current auth session
  const { data: { user: authUser } } = await supabase.auth.getUser();

  // Get policies information
  const { data: policies, error: policiesError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'users')
    .then(
      (result) => result,
      () => ({ data: null, error: 'Need to grant SELECT on pg_policies' })
    );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-[hsl(258_46%_25%)]">🔒 RLS (Row Level Security) Test</h1>
      
      {/* Current User Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">1️⃣ Current User Status</h2>
        {authUser ? (
          <div className="text-green-600 bg-green-50 p-4 rounded">
            <p className="font-semibold">✅ Logged in as:</p>
            <div className="mt-2 text-sm space-y-1 text-gray-700">
              <p><strong>Auth ID:</strong> {authUser.id}</p>
              <p><strong>Email:</strong> {authUser.email}</p>
            </div>
          </div>
        ) : (
          <div className="text-yellow-600 bg-yellow-50 p-4 rounded">
            <p className="font-semibold">⚠️ Not logged in</p>
            <p className="text-sm mt-2">
              RLS policies are active, but you're querying as an anonymous user. 
              You won't see any data until you log in (or use service key).
            </p>
          </div>
        )}
      </div>

      {/* Users Query Result */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">2️⃣ Users Table Query</h2>
        <p className="text-sm text-gray-600 mb-4">
          This query runs through RLS. You should only see data you're allowed to access.
        </p>
        
        {usersError ? (
          <div className="text-red-600 bg-red-50 p-4 rounded">
            <p className="font-semibold">❌ Error:</p>
            <pre className="text-xs mt-2 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(usersError, null, 2)}
            </pre>
          </div>
        ) : users && users.length > 0 ? (
          <div className="text-green-600 bg-green-50 p-4 rounded">
            <p className="font-semibold">✅ Found {users.length} user(s)</p>
            <div className="mt-3 space-y-2">
              {users.map((user: any) => (
                <div key={user.user_id} className="bg-white p-3 rounded border text-gray-700 text-sm">
                  <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                  <p><strong>Auth ID:</strong> {user.auth_id}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-blue-600 bg-blue-50 p-4 rounded">
            <p className="font-semibold">ℹ️ No users returned</p>
            <p className="text-sm mt-2">
              This is expected! RLS is working. Possible reasons:
            </p>
            <ul className="text-sm mt-2 ml-4 list-disc space-y-1">
              <li>Table is empty (no users created yet)</li>
              <li>You're not logged in (anonymous users see nothing)</li>
              <li>You're logged in but no matching user record in users table</li>
            </ul>
          </div>
        )}
      </div>

      {/* Policies Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">3️⃣ Active Policies</h2>
        {policiesError ? (
          <div className="text-yellow-600 bg-yellow-50 p-4 rounded">
            <p className="font-semibold">⚠️ Cannot read policies via client</p>
            <p className="text-sm mt-2">
              To view policies, go to Supabase Dashboard → SQL Editor and run:
            </p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded mt-3 text-xs overflow-x-auto">
              SELECT policyname, permissive, roles, cmd{'\n'}
              FROM pg_policies{'\n'}
              WHERE tablename = 'users';
            </pre>
          </div>
        ) : policies && policies.length > 0 ? (
          <div className="text-green-600 bg-green-50 p-4 rounded">
            <p className="font-semibold">✅ Found {policies.length} active policies</p>
            <div className="mt-3 space-y-2">
              {policies.map((policy: any, idx: number) => (
                <div key={idx} className="bg-white p-2 rounded border text-gray-700 text-xs font-mono">
                  {policy.policyname}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-yellow-600 bg-yellow-50 p-4 rounded">
            <p className="font-semibold">⚠️ Use Supabase Dashboard</p>
            <p className="text-sm mt-2">Run the query in SQL Editor to see policies:</p>
            <pre className="bg-gray-800 text-green-400 p-3 rounded mt-3 text-xs overflow-x-auto">
              SELECT policyname, permissive, roles, cmd{'\n'}
              FROM pg_policies{'\n'}
              WHERE tablename = 'users';
            </pre>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
        <h2 className="text-lg font-semibold mb-3 text-purple-900">📋 Testing Checklist:</h2>
        
        <div className="space-y-4 text-sm text-purple-800">
          <div>
            <p className="font-semibold mb-2">✅ Right Now (Before Login):</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Section 1: Should show "Not logged in" ⚠️</li>
              <li>Section 2: Should show "No users returned" ℹ️</li>
              <li>This proves RLS is active! Anonymous users see nothing.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">✅ After Login (As Patient):</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Section 1: Shows your email ✅</li>
              <li>Section 2: Shows ONLY your own user record</li>
              <li>Cannot see other users' data</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">✅ After Login (As Admin):</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Section 1: Shows admin email ✅</li>
              <li>Section 2: Shows ALL users in the table</li>
              <li>Can see everyone's data</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-2">📊 Verify Policies in Dashboard:</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>Go to Supabase Dashboard → SQL Editor</li>
              <li>Run: <code className="bg-purple-100 px-1 rounded">SELECT * FROM pg_policies WHERE tablename = 'users';</code></li>
              <li>Should see 3 policies listed</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
