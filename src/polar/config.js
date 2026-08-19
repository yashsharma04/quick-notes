export const COFFEE_PRODUCT_ID = '0bb40a74-b16e-43b4-8d3e-d75760e1856b'

export function coffeeCheckoutPath(productId = COFFEE_PRODUCT_ID) {
  return `/checkout?products=${productId}`
}
