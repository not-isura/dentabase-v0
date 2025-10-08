import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export default async function TestMiddleware() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  
  // Get all cookies to check if Supabase auth cookies exist
  const allCookies = cookieStore.getAll();
  const supabaseCookies = allCookies.filter(cookie => 
    cookie.name.startsWith('sb-') || cookie.name.includes('supabase')
  );

  // Check auth session
  const { data: { session }, error } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-[hsl(258_46%_25%)]">🔧 Middleware Test Page</h1>
      
      {/* Middleware Status */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">1️⃣ Middleware Status</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl">✅</div>
            <div>
              <p className="font-semibold text-green-600">Middleware is Running!</p>
              <p className="text-sm text-gray-600">
                If you can see this page, middleware executed successfully
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Check */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">2️⃣ Supabase Cookies</h2>
        {supabaseCookies.length > 0 ? (
          <div className="text-green-600 bg-green-50 p-4 rounded">
            <p className="font-semibold">✅ Found {supabaseCookies.length} Supabase cookie(s)</p>
            <div className="mt-3 space-y-2 text-sm">
              {supabaseCookies.map((cookie) => (
                <div key={cookie.name} className="font-mono text-xs bg-white p-2 rounded border">
                  <span className="text-gray-700">{cookie.name}</span>
                  <span className="text-gray-400"> = </span>
                  <span className="text-gray-500">{cookie.value.substring(0, 50)}...</span>
                </div>
              ))}
            </div>
            <p className="text-sm mt-3 text-gray-700">
              These cookies are managed by middleware for auth token refresh.
            </p>
          </div>
        ) : (
          <div className="text-yellow-600 bg-yellow-50 p-4 rounded">
            <p className="font-semibold">⚠️ No Supabase auth cookies found</p>
            <p className="text-sm mt-2">
              This is normal if no user has logged in yet. Cookies will appear after first login.
            </p>
          </div>
        )}
      </div>

      {/* Session Check */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">3️⃣ Auth Session</h2>
        {error ? (
          <div className="text-red-600 bg-red-50 p-4 rounded">
            <p className="font-semibold">❌ Session Error:</p>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
          </div>
        ) : session ? (
          <div className="text-green-600 bg-green-50 p-4 rounded">
            <p className="font-semibold">✅ Active Session Found!</p>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Session expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
            </div>
            <p className="text-xs mt-3 text-gray-600">
              Middleware will automatically refresh this token before it expires.
            </p>
          </div>
        ) : (
          <div className="text-blue-600 bg-blue-50 p-4 rounded">
            <p className="font-semibold">ℹ️ No active session</p>
            <p className="text-sm mt-2">
              This is expected before you implement login. Once users log in, you'll see session data here.
            </p>
          </div>
        )}
      </div>

      {/* Total Cookies Count */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">4️⃣ All Cookies</h2>
        <div className="text-sm text-gray-700">
          <p className="mb-2">Total cookies on this request: <strong>{allCookies.length}</strong></p>
          <details className="cursor-pointer">
            <summary className="text-blue-600 hover:text-blue-800">Show all cookies</summary>
            <div className="mt-3 space-y-1 max-h-48 overflow-auto">
              {allCookies.map((cookie) => (
                <div key={cookie.name} className="font-mono text-xs bg-gray-50 p-2 rounded">
                  {cookie.name}
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
        <h2 className="text-lg font-semibold mb-3 text-purple-900">✨ What This Means:</h2>
        <ul className="space-y-2 text-sm text-purple-800">
          <li><strong>✅ Section 1:</strong> Middleware executed on this request</li>
          <li><strong>✅ Section 2:</strong> Shows Supabase auth cookies (empty until login)</li>
          <li><strong>✅ Section 3:</strong> Shows current auth session (none until login)</li>
          <li><strong>ℹ️ Next Step:</strong> When you create login/register pages, revisit this page after logging in to see active session data!</li>
        </ul>
      </div>

      {/* Test Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-[hsl(258_46%_25%)]">🧪 Test Middleware Behavior</h2>
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">Try these actions to verify middleware is working:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
            <li>Refresh this page → Middleware runs again</li>
            <li>Navigate to <a href="/read_db" className="text-blue-600 hover:underline">/read_db</a> → Middleware runs</li>
            <li>Navigate to <a href="/dashboard" className="text-blue-600 hover:underline">/dashboard</a> → Middleware runs</li>
            <li>Check browser DevTools → Network tab → Look for cookie headers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
