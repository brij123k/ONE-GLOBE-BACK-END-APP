export function buildMetaTitleAIPrompt(
  product: any,
  dto: any,
): string {
  const baseTitle = product.title;
  const existingMetaTitle = product.seo?.title || '';

  return `
You are an expert Shopify SEO specialist.

Your task is to generate a HIGH-CTR, search-optimized META TITLE for a Shopify product.

Product Info:
- Current Title: "${product.title}"
- Description: "${product.description}"
- Category: ${dto.categoryName}
- Vendor: ${product.vendor || 'N/A'}
- Product Type: ${product.productType || 'N/A'}

Rules (VERY IMPORTANT):
- Character length: ${dto.minCharacters}-${dto.maxCharacters}
- Do NOT use quotes
- Do NOT add emojis
- Do NOT repeat words unnecessarily
- Make it readable, natural, and click-worthy
- Prefer strong keywords at the beginning
- Avoid keyword stuffing
- Do NOT include the brand name unless it adds SEO value
- Category Name: ${dto.categoryName || 'None'}
- Primary Element: ${dto.primaryElement || 'None'}
- Secondary Element: ${dto.secondaryElement || 'None'}
- Third Element: ${dto.thirdElement || 'None'}
- Fourth Element: ${dto.fourthElement || 'None'}
- Formula Pattern: ${dto.formulaPattern || 'None'}
- Brand Focused: ${dto.brandFocused || 'None'}
- Must include keywords: ${dto.mustIncludeKeywords || 'None'}
- Exclude keywords: ${dto.excludeKeywords || 'None'}
- Tone: ${dto.tone || 'Professional'}

Product Context:
- Product Title: "${baseTitle}"
- Existing Meta Title: "${existingMetaTitle}"

What to optimize for:
- Higher click-through rate
- Clear product intent
- SEO-friendly phrasing
- Commercial search terms

Output:
- Return ONLY the optimized meta title text
- No explanations
- No formatting
`;
}
