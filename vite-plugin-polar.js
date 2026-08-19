import { loadEnv } from 'vite'
import { createPolarClient } from './src/polar/client.js'
import { handleCheckoutGet } from './src/polar/checkout.js'
import { handlePolarWebhookPost } from './src/polar/webhook.js'

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

async function toFetchRequest(req) {
  const host = req.headers.host || 'localhost'
  const url = `http://${host}${req.originalUrl || req.url}`
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue
    headers.set(key, Array.isArray(value) ? value.join(', ') : String(value))
  }

  const init = { method: req.method, headers }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await collectBody(req)
  }
  return new Request(url, init)
}

async function sendFetchResponse(nodeRes, fetchRes) {
  nodeRes.statusCode = fetchRes.status
  fetchRes.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value)
  })
  const buffer = Buffer.from(await fetchRes.arrayBuffer())
  nodeRes.end(buffer)
}

export function polarDevPlugin() {
  return {
    name: 'polar-dev-routes',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const polar = createPolarClient(env)

      server.middlewares.use(async (req, res, next) => {
        const path = (req.originalUrl || req.url || '').split('?')[0]
        try {
          if (req.method === 'GET' && path === '/checkout') {
            const request = await toFetchRequest(req)
            const response = await handleCheckoutGet(request, polar)
            await sendFetchResponse(res, response)
            return
          }
          if (req.method === 'POST' && path === '/api/webhook/polar') {
            const request = await toFetchRequest(req)
            const response = await handlePolarWebhookPost(
              request,
              env.POLAR_WEBHOOK_SECRET,
            )
            await sendFetchResponse(res, response)
            return
          }
        } catch (error) {
          console.error(error)
          res.statusCode = 500
          res.end()
          return
        }
        next()
      })
    },
  }
}
