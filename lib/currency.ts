export const CURRENCY_SYMBOL = '₹'
export const CURRENCY_CODE = 'INR'

export function formatPrice(price: number): string {
  return `${CURRENCY_SYMBOL}${price.toFixed(2)}`
}
