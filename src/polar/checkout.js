export async function handleCheckoutGet(request, polar) {
  const url = new URL(request.url)
  const products = url.searchParams.getAll('products').filter(Boolean)

  if (products.length === 0) {
    return Response.json(
      { error: 'Missing products in query params' },
      { status: 400 },
    )
  }

  try {
    const result = await polar.checkouts.create({ products })
    return Response.redirect(result.url, 302)
  } catch (error) {
    console.error(error)
    return new Response(null, { status: 500 })
  }
}
