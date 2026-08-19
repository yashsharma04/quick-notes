import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleCheckoutGet } from './checkout.js'

test('returns 400 when products query param is missing', async () => {
  const polar = { checkouts: { create: async () => { throw new Error('should not be called') } } }
  const response = await handleCheckoutGet(new Request('http://localhost/checkout'), polar)
  assert.equal(response.status, 400)
})

test('creates a Polar checkout and redirects to the hosted URL without a successUrl', async () => {
  const calls = []
  const polar = {
    checkouts: {
      create: async (body) => {
        calls.push(body)
        return { url: 'https://polar.sh/checkout/test-session' }
      },
    },
  }

  const response = await handleCheckoutGet(
    new Request('http://localhost/checkout?products=prod_123'),
    polar,
  )

  assert.equal(response.status, 302)
  assert.equal(response.headers.get('location'), 'https://polar.sh/checkout/test-session')
  assert.deepEqual(calls[0].products, ['prod_123'])
  assert.equal('successUrl' in calls[0], false)
})

test('returns 500 when Polar checkout creation fails', async () => {
  const polar = {
    checkouts: {
      create: async () => {
        throw new Error('polar down')
      },
    },
  }

  const response = await handleCheckoutGet(
    new Request('http://localhost/checkout?products=prod_123'),
    polar,
  )
  assert.equal(response.status, 500)
})
