import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COFFEE_PRODUCT_ID, coffeeCheckoutPath } from './config.js'

test('coffee checkout path points at Polar checkout with the coffee product id', () => {
  assert.match(COFFEE_PRODUCT_ID, /^[0-9a-f-]{36}$/i)
  assert.equal(
    coffeeCheckoutPath(),
    `/checkout?products=${COFFEE_PRODUCT_ID}`,
  )
})
