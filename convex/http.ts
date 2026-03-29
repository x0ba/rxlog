// convex/http.ts
import { httpRouter } from 'convex/server'
import { Webhook } from 'svix'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'

const http = httpRouter()

type ClerkWebhookUserData = {
  id: string
  first_name?: string | null
  last_name?: string | null
  image_url?: string | null
  primary_email_address_id?: string | null
  email_addresses: Array<{
    id: string
    email_address: string
  }>
}

type ClerkWebhookEvent =
  | {
      type: 'user.created' | 'user.updated'
      data: ClerkWebhookUserData
    }
  | {
      type: 'user.deleted'
      data: {
        id?: string | null
      }
    }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getOptionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function parseEmailAddresses(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return []
    }

    const id = getOptionalString(entry.id)
    const emailAddress = getOptionalString(entry.email_address)
    if (!id || !emailAddress) {
      return []
    }

    return [{ id, email_address: emailAddress }]
  })
}

function parseClerkWebhookEvent(value: unknown): ClerkWebhookEvent | null {
  if (
    !isRecord(value) ||
    typeof value.type !== 'string' ||
    !isRecord(value.data)
  ) {
    return null
  }

  if (value.type === 'user.created' || value.type === 'user.updated') {
    const id = getOptionalString(value.data.id)
    if (!id) {
      return null
    }

    return {
      type: value.type,
      data: {
        id,
        first_name: getOptionalString(value.data.first_name) ?? null,
        last_name: getOptionalString(value.data.last_name) ?? null,
        image_url: getOptionalString(value.data.image_url) ?? null,
        primary_email_address_id:
          getOptionalString(value.data.primary_email_address_id) ?? null,
        email_addresses: parseEmailAddresses(value.data.email_addresses),
      },
    }
  }

  if (value.type === 'user.deleted') {
    return {
      type: value.type,
      data: {
        id: getOptionalString(value.data.id) ?? null,
      },
    }
  }

  return null
}

function getPreferredEmail(data: ClerkWebhookUserData) {
  const primaryEmail = data.primary_email_address_id
    ? data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
      )
    : undefined

  return primaryEmail?.email_address ?? data.email_addresses[0]?.email_address
}

http.route({
  path: '/webhooks/clerk',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN
    if (!secret || !issuerDomain) {
      return new Response('Missing Clerk webhook configuration', {
        status: 500,
      })
    }

    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing Svix headers', { status: 400 })
    }

    const payload = await request.text()

    let event: ClerkWebhookEvent | null = null
    try {
      const wh = new Webhook(secret)
      event = parseClerkWebhookEvent(
        wh.verify(payload, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        }),
      )
    } catch (error) {
      console.error('Clerk webhook signature verification failed', error)
      return new Response('Invalid signature', { status: 400 })
    }

    if (!event) {
      return new Response('Unsupported Clerk event payload', { status: 400 })
    }

    console.log('Clerk webhook received', event.type)

    if (event.type === 'user.created' || event.type === 'user.updated') {
      const syncedUserId = await ctx.runMutation(
        internal.users.upsertFromClerk,
        {
          authIdentifier: `${issuerDomain}|${event.data.id}`,
          clerkUserId: event.data.id,
          email: getPreferredEmail(event.data),
          name:
            [event.data.first_name, event.data.last_name]
              .filter((part): part is string => Boolean(part))
              .join(' ') || undefined,
          imageUrl: event.data.image_url ?? undefined,
        },
      )

      console.log('Clerk user sync complete', {
        clerkUserId: event.data.id,
        eventType: event.type,
        userId: syncedUserId,
      })
    }

    if (event.type === 'user.deleted' && event.data.id) {
      const deletedUserId = await ctx.runMutation(
        internal.users.deleteFromClerk,
        {
          clerkUserId: event.data.id,
        },
      )

      console.log('Clerk user delete complete', {
        clerkUserId: event.data.id,
        userId: deletedUserId,
      })
    }

    return new Response('ok', { status: 200 })
  }),
})

export default http
