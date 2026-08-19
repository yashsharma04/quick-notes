import { Polar } from '@polar-sh/sdk'

export function createPolarClient(env) {
  const server = env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production'
  return new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server,
  })
}
