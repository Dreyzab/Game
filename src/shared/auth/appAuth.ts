import { createContext, useContext } from 'react'

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

export const AuthContext = createContext<AppAuth | null>(null)

export const guestAuth: AppAuth = {
  getToken: async () => null,
  isLoaded: true,
  isSignedIn: false,
  user: null,
  signOut: async () => undefined,
}

export function useAppAuth(): AppAuth {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAppAuth must be used within <GuestAuthProvider> or <ClerkAuthBridge>.')
  }
  return ctx
}
