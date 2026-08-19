import { handlePolarWebhookPost } from '../../../src/polar/webhook.js'

export async function onRequestPost(context) {
  const secret = context.env.POLAR_WEBHOOK_SECRET
  if (!secret) {
    return new Response(null, { status: 500 })
  }
  return handlePolarWebhookPost(context.request, secret)
}
