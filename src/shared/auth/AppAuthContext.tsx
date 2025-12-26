import { createContext, useContext, useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react'

export type AppUser = {
  fullName?: string | null
  email?: string | null
  username?: string | null
}

export type AppAuth = {
  getToken: () => Promise<string | null>
  isLoaded: boolean
  isSignedIn: boolean
  user: AppUser | null
  signOut: (opts?: { redirectUrl?: string }) => Promise<void> | void
}

const AuthContext = createContext<AppAuth | null>(null)

const guestAuth: AppAuth = {
  getToken: async () => null,
  isLoaded: true,
  isSignedIn: false,
  user: null,
  signOut: async () => undefined,
}

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

export function useAppAuth(): AppAuth {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAppAuth must be used within <GuestAuthProvider> or <ClerkAuthBridge>.')
  }
  return ctx
}


