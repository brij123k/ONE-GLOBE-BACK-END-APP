export function buildMetaDescriptionAIPrompt(
  product: any,
  dto: any,
): string {
  const imageUrl = product.featuredMedia?.preview?.image?.url || 'No image found';
  const useImage = dto.image !== false;
  const useDescription = dto.description !== false;
  const imageContext = useImage
    ? `- Product Image URL: ${imageUrl}`
    : '- Product Image: Do not use image context for this request';
  const descriptionContext = useDescription
    ? `- Existing Description: "${product.description || 'Not provided'}"`
    : `- Existing Description: Do not use old description context for this request`;
  const sourceInstruction =
    useImage && useDescription
      ? `- Use both the product image and existing description.
- Treat the product image as the primary source of truth.
- Use the existing description as supporting context.`
      : useImage
        ? `- Use the product image as the source of truth.
- Identify the visible product, style, color, material, pattern, shape, intended use, and obvious product attributes.
- Do not use the old description as product context.`
        : `- Use the existing product description as the source of truth.
- Do not use the product image as product context.`;

  return `
You are an expert Shopify SEO specialist.

Your task is to generate a HIGH-CTR, search-optimized META description for a Shopify product.

Source Instructions:
${sourceInstruction}
- If enabled sources conflict, prioritize the image.
- Do not invent brand names, model numbers, sizes, materials, or claims that are not visible or provided.

Rules (VERY IMPORTANT):
- Minimun length: 100 characters
- Maximum length: 160 characters
- Do NOT use quotes
- Do NOT add emojis
- Do NOT repeat words unnecessarily
- Make it readable, natural, and click-worthy
- Prefer strong keywords at the beginning
- Avoid keyword stuffing
- Do NOT include the brand name unless it adds SEO value

Product Context:
${imageContext}
${descriptionContext}
- Product Title: "${product.title}"
- Existing Meta Description: "${product.seo?.description || product.description}"
- Existing Meta Title: "${product.seo?.title}"

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
