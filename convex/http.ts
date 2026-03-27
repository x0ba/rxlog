// convex/http.ts
import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { internal } from './_generated/api'
import { Webhook } from 'svix'

const http = httpRouter()

http.route({
  path: '/webhooks/clerk',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) {
      return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 })
    }

    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response('Missing Svix headers', { status: 400 })
    }

    const payload = await request.text()

    let evt: any
    try {
      const wh = new Webhook(secret)
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      })
    } catch {
      return new Response('Invalid signature', { status: 400 })
    }

    const eventType = evt.type
    const data = evt.data

    if (eventType === 'user.created' || eventType === 'user.updated') {
      await ctx.runMutation(internal.users.upsertFromClerk, {
        clerkUserId: data.id,
        email: data.email_addresses?.[0]?.email_address,
        name:
          [data.first_name, data.last_name].filter(Boolean).join(' ') ||
          undefined,
        imageUrl: data.image_url,
      })
    }

    if (eventType === 'user.deleted') {
      if (data.id) {
        await ctx.runMutation(internal.users.deleteFromClerk, {
          clerkUserId: data.id,
        })
      }
    }

    return new Response('ok', { status: 200 })
  }),
})

export default http
