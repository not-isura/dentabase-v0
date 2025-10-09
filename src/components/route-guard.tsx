import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface RouteGuardProps {
  children: React.ReactNode
}

/**
 * RouteGuard - Server Component for Protected Routes
 * 
 * Checks if user is authenticated before rendering protected pages.
 * If not authenticated, redirects to /login.
 * 
 * Usage: Wrap protected layouts/pages with this component
 */
export async function RouteGuard({ children }: RouteGuardProps) {
  const supabase = await createClient()
  
  // 🔴 TEMPORARY: Simulate slow connection (uncomment to test loading animation)
  // await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay
  
  // Check authentication - this validates token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // If no user or error, redirect to login with warning message
  if (!user || error) {
    redirect('/login?type=warning&message=Please login to continue')
  }
  
  // User is authenticated, render the protected content
  return <>{children}</>
}
