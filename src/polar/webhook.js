import {
  validateEvent as defaultValidateEvent,
  WebhookVerificationError as DefaultWebhookVerificationError,
} from '@polar-sh/sdk/webhooks'

export async function handlePolarWebhookPost(request, secret, deps = {}) {
  const validateEvent = deps.validateEvent ?? defaultValidateEvent
  const WebhookVerificationError =
    deps.WebhookVerificationError ?? DefaultWebhookVerificationError
  const onOrderPaid = deps.onOrderPaid ?? defaultOnOrderPaid
  const onCustomerStateChanged =
    deps.onCustomerStateChanged ?? defaultOnCustomerStateChanged

  const body = await request.text()

  let event
  try {
    event = validateEvent(
      body,
      {
        'webhook-id': request.headers.get('webhook-id') ?? '',
        'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
        'webhook-signature': request.headers.get('webhook-signature') ?? '',
      },
      secret,
    )
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      return Response.json({ received: false }, { status: 403 })
    }
    throw error
  }

  switch (event.type) {
    case 'order.paid':
      // TODO: fulfill the paid order (grant access, send receipt, etc.)
      onOrderPaid(event)
      break
    case 'customer.state_changed':
      // TODO: sync Polar customer state to the app user record
      onCustomerStateChanged(event)
      break
    default:
      break
  }

  return Response.json({ received: true })
}

function defaultOnOrderPaid(event) {
  console.log('TODO order.paid', event.data?.id)
}

function defaultOnCustomerStateChanged(event) {
  console.log('TODO customer.state_changed', event.data?.id)
}
