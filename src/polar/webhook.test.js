import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePolarWebhookPost } from './webhook.js'

function postRequest(body = '{}') {
  return new Request('http://localhost/api/webhook/polar', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': 'msg_1',
      'webhook-timestamp': '1',
      'webhook-signature': 'sig',
    },
    body,
  })
}

test('returns 403 when webhook signature is invalid', async () => {
  class WebhookVerificationError extends Error {}
  const response = await handlePolarWebhookPost(postRequest(), 'whsec_test', {
    validateEvent: () => {
      throw new WebhookVerificationError('bad sig')
    },
    WebhookVerificationError,
  })
  assert.equal(response.status, 403)
})

test('handles order.paid with a TODO stub and returns 200', async () => {
  const handled = []
  const response = await handlePolarWebhookPost(postRequest(), 'whsec_test', {
    validateEvent: () => ({ type: 'order.paid', data: { id: 'ord_1' } }),
    WebhookVerificationError: class extends Error {},
    onOrderPaid: (event) => handled.push(event.type),
  })
  assert.equal(response.status, 200)
  const json = await response.json()
  assert.equal(json.received, true)
  assert.deepEqual(handled, ['order.paid'])
})

test('handles customer.state_changed with a TODO stub and returns 200', async () => {
  const handled = []
  const response = await handlePolarWebhookPost(postRequest(), 'whsec_test', {
    validateEvent: () => ({ type: 'customer.state_changed', data: { id: 'cus_1' } }),
    WebhookVerificationError: class extends Error {},
    onCustomerStateChanged: (event) => handled.push(event.type),
  })
  assert.equal(response.status, 200)
  assert.deepEqual(handled, ['customer.state_changed'])
})
