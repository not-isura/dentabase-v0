import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Server Component for Auth Pages (Login/Register)
 * 
 * Prevents authenticated users from accessing login/register pages.
 * If already logged in, redirects to dashboard.
 * 
 * Usage: Wrap login/register pages with this component
 */
export async function AuthGuard({ children }: AuthGuardProps) {
  const supabase = await createClient()
  
  // 🔴 TEMPORARY: Simulate slow connection (uncomment to test loading animation)
  // await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay
  
  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is logged in, redirect to dashboard with message
  if (user) {
    redirect('/dashboard?message=You are already logged in')
  }
  
  // User is not logged in, show auth page
  return <>{children}</>
}
