import { useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react'
import { AuthContext, guestAuth, type AppAuth, type AppUser } from './appAuth'

export function GuestAuthProvider({ children }: PropsWithChildren) {
  return <AuthContext.Provider value={guestAuth}>{children}</AuthContext.Provider>
}

export function ClerkAuthBridge({ children }: PropsWithChildren) {
  const { getToken, isLoaded, isSignedIn } = useClerkAuth()
  const { signOut } = useClerk()
  const { user } = useUser()

  const value = useMemo<AppAuth>(() => {
    const mappedUser: AppUser | null = user
      ? {
          fullName: user.fullName ?? null,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          username: user.username ?? null,
        }
      : null

    return {
      getToken,
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      user: mappedUser,
      signOut,
    }
  }, [getToken, isLoaded, isSignedIn, signOut, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


