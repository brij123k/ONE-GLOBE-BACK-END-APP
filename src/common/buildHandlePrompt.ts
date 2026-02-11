export function buildProductHandleAIPrompt(
  product: any,
  dto: any,
): string {
  const baseTitle = product.title;
  const existingHandle = product.handle || '';

  return `
You are an expert Shopify SEO specialist.

Your task is to generate an SEO-optimized PRODUCT HANDLE (URL slug) for a Shopify product.

Rules (VERY IMPORTANT):
- Use ONLY lowercase letters
- Use hyphens (-) between words
- No spaces
- No special characters
- No underscores
- No emojis
- No quotes
- Keep it short and clean
- Maximum 60 characters
- Must be URL-friendly
- Must be readable by humans
- Avoid repeating words
- Remove filler words like: the, and, for, with
- Do NOT include brand name unless necessary for SEO
- Focus on main keyword + product intent
- Make it suitable for Shopify product URL

SEO Goals:
- Clear product keyword
- High search intent
- Clean slug structure
- Clickable and readable
- Optimized for Google

Product Context:
- Product Title: "${baseTitle}"
- Existing Handle: "${existingHandle}"

Output Rules:
- Return ONLY the handle text
- No /products/
- No explanation
- No formatting
- Just the slug

Example outputs:
running-shoes-men
leather-wallet-slim
wireless-bluetooth-headphones
`;
}
