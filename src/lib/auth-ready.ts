import { api } from '../../convex/_generated/api'
import type { QueryClient } from '@tanstack/react-query'
import type { ConvexReactClient } from 'convex/react'
import { profileQuery } from '~/lib/convex-queries'

const RETRY_DELAYS_MS = [50, 100, 200, 400, 500]

let authedAppReady = false
let authedAppReadyPromise: Promise<void> | null = null

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function isRetryableAuthBootstrapError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes('unauthorized') ||
    message.includes('unauthenticated') ||
    message.includes('authentication') ||
    message.includes('not authenticated') ||
    message.includes('token') ||
    message.includes('jwt') ||
    message.includes('session')
  )
}

async function bootstrapAuthedApp({
  convexClient,
  queryClient,
  timeoutMs,
}: {
  convexClient: ConvexReactClient
  queryClient: QueryClient
  timeoutMs: number
}) {
  const startedAt = Date.now()
  let attempt = 0
  let lastError: unknown = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const query = profileQuery()
      const profile = await convexClient.mutation(
        api.users.ensureCurrentUser,
        {},
      )
      queryClient.setQueryData(query.queryKey, profile)
      authedAppReady = true
      return
    } catch (error) {
      lastError = error

      if (!isRetryableAuthBootstrapError(error)) {
        throw error
      }
    }

    const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]
    attempt += 1
    await sleep(delay)
  }

  const suffix =
    lastError == null ? '' : ` Last error: ${getErrorMessage(lastError)}`
  throw new Error(`Auth session did not become ready in time.${suffix}`)
}

export function resetAuthedAppReady() {
  authedAppReady = false
  authedAppReadyPromise = null
}

export async function waitForAuthedAppReady({
  convexClient,
  queryClient,
  timeoutMs = 5000,
}: {
  convexClient: ConvexReactClient
  queryClient: QueryClient
  timeoutMs?: number
}) {
  if (typeof window === 'undefined' || authedAppReady) {
    return
  }

  if (authedAppReadyPromise == null) {
    authedAppReadyPromise = bootstrapAuthedApp({
      convexClient,
      queryClient,
      timeoutMs,
    }).catch((error) => {
      authedAppReadyPromise = null
      throw error
    })
  }

  await authedAppReadyPromise
}
