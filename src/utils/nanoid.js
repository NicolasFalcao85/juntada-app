export function nanoid(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < len; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
  return result
}
