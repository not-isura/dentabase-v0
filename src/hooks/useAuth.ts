import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import type { AuthContextType } from "@/types/auth.types";

/**
 * Custom hook to access Auth Context
 * 
 * Usage:
 * ```tsx
 * const { user, isLoading, refreshUser } = useAuth();
 * 
 * if (isLoading) return <Loading />;
 * if (!user) return <NotLoggedIn />;
 * 
 * return <div>Hello {user.first_name}!</div>;
 * ```
 * 
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
      "Make sure your component is wrapped with <AuthProvider> in layout.tsx"
    );
  }
  
  return context;
}
