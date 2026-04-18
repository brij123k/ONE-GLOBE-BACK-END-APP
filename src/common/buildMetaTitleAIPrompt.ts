export function buildMetaTitleAIPrompt(
  product: any,
  dto: any,
): string {
  const imageUrl = product.featuredMedia?.preview?.image?.url || 'No image found';
  const useImage = dto.image !== false;
  const useTitle = dto.title !== false;
  const imageContext = useImage
    ? `- Product Image URL: ${imageUrl}`
    : '- Product Image: Do not use image context for this request';
  const titleContext = useTitle
    ? `- Current Title: "${product.title || 'Not provided'}"
- Description: "${product.description || 'Not provided'}"`
    : `- Current Title: Do not use old title context for this request
- Description: Do not use old description context for this request`;
  const sourceInstruction =
    useImage && useTitle
      ? `- Use both the product image and current title/description.
- Treat the product image as the primary source of truth.
- Use the current title and description as supporting context.`
      : useImage
        ? `- Use the product image as the source of truth.
- Identify the visible product, style, color, material, pattern, shape, intended use, and obvious product attributes.
- Do not use the old title or old description as product context.`
        : `- Use the current product title and description as the source of truth.
- Do not use the product image as product context.`;

  return `
You are an expert Shopify SEO specialist.

Your task is to generate a HIGH-CTR, search-optimized META TITLE for a Shopify product.

Product Info:
${imageContext}
${titleContext}
- Category: ${dto.categoryName}
- Vendor: ${product.vendor || 'N/A'}
- Product Type: ${product.productType || 'N/A'}

Source Instructions:
${sourceInstruction}
- If enabled sources conflict, prioritize the image.
- Do not invent brand names, model numbers, sizes, materials, or claims that are not visible or provided.

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
- Product Title: "${product.title}"
- Existing Meta Title: "${product.seo?.title || ''}"

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
