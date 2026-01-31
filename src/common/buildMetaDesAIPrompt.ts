export function buildMetaDescriptionAIPrompt(
  product: any,
  dto: any,
): string {
  const baseDescription = product.description;
  const existingMetaDescription = product.seo?.description || product.description;

return `
You are an expert Shopify SEO specialist.

Your task is to generate a HIGH-CTR, search-optimized META TITLE for a Shopify product.

Rules (VERY IMPORTANT):
- Maximum length: 60 characters
- Do NOT use quotes
- Do NOT add emojis
- Do NOT repeat words unnecessarily
- Make it readable, natural, and click-worthy
- Prefer strong keywords at the beginning
- Avoid keyword stuffing
- Do NOT include the brand name unless it adds SEO value

Product Context:
- Product Description: "${baseDescription}"
- Existing Meta Description: "${existingMetaDescription}"

What to optimize for:
- Higher click-through rate
- Clear product intent
- SEO-friendly phrasing
- Commercial search terms

Output:
- Return ONLY the optimized meta description text
- No explanations
- No formatting
`;
}
