export const clerkPublishableKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined) ?? undefined

export const isAuthDisabled = String(import.meta.env.VITE_DISABLE_AUTH ?? '').toLowerCase() === 'true'

// Clerk is enabled only when we have a publishable key AND auth isn't explicitly disabled.
export const isClerkEnabled = Boolean(clerkPublishableKey) && !isAuthDisabled


