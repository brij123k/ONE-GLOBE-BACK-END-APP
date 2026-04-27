export function buildTitleAIPrompt(
  product: any,
  input: any,
): string {
  const imageUrl = product.featuredMedia?.preview?.image?.url || 'No image found';
  const useImage = input.image !== false;
  const useTitle = input.title !== false;
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

  const hasExamples = Array.isArray(input.examples) && input.examples.length > 0;
  const examples = hasExamples
    ? `Use the following examples as mandatory inspiration for the title. Do not ignore them:
- Examples: ${input.examples.join(', ')}`
    : `Give the perfect title`;

  return `
You are an expert Shopify SEO copywriter.

Generate ONE optimized product title only.

Product Info:
${imageContext}
${titleContext}
${examples}
- Category: ${input.categoryName || 'Not provided'}
- Vendor: ${product.vendor || 'N/A'}
- Product Type: ${product.productType || 'N/A'}

Source Instructions:
${sourceInstruction}
- If enabled sources conflict, prioritize the image.
- Do not invent brand names, model numbers, sizes, materials, or claims that are not visible or provided.

Rules:
- Character length: ${input.minCharacters}-${input.maxCharacters}
- Category Name: ${input.categoryName || 'None'}
- Primary Element: ${input.primaryElement || 'None'}
- Secondary Element: ${input.secondaryElement || 'None'}
- Third Element: ${input.thirdElement || 'None'}
- Fourth Element: ${input.fourthElement || 'None'}
- Formula Pattern: ${input.formulaPattern || 'None'}
- Brand Focused: ${input.brandFocused || 'None'}
- Must include keywords: ${input.mustIncludeKeywords || 'None'}
- Exclude keywords: ${input.excludeKeywords || 'None'}
- Tone: ${input.tone || 'Professional'}
- Do not use the pipe character: |

Strict Instructions:
- Return ONLY the title
- Never include the pipe character: |
- No quotes
- No explanations
- No emojis
- No markdown
`;
}
