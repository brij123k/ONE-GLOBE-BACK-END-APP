export function buildTitleAIPrompt(
  product: any,
  input: any,
): string {
  return `
You are an expert Shopify SEO copywriter.

Generate ONE optimized product title only.

Product Info:
- Current Title: "${product.title}"
- Description: "${product.description}"
- Category: ${input.categoryName}
- Vendor: ${product.vendor || 'N/A'}
- Product Type: ${product.productType || 'N/A'}

Rules:
- Character length: ${input.minCharacters}-${input.maxCharacters}
- Primary Element: ${input.primaryElement || 'None'}
- Secondary Element: ${input.secondaryElement || 'None'}
- Must include keywords: ${input.mustIncludeKeywords || 'None'}
- Exclude keywords: ${input.excludeKeywords || 'None'}
- Tone: ${input.tone || 'Professional'}

Strict Instructions:
- Return ONLY the title
- No quotes
- No explanations
- No emojis
- No markdown
`;
}
