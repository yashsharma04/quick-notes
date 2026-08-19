import { createPolarClient } from '../src/polar/client.js'
import { handleCheckoutGet } from '../src/polar/checkout.js'

export async function onRequestGet(context) {
  const polar = createPolarClient(context.env)
  return handleCheckoutGet(context.request, polar)
}
