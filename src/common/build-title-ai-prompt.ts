export function buildTitleAIPrompt(
  product: any,
  input: any,
): string {
  const imageUrl = product.featuredMedia?.preview?.image?.url || 'No image found';
  const useImage = input.image !== false;
  const useTitle = input.title !== false;

  const imageContext = useImage
    ? `- Product Image URL: ${imageUrl}`
    : `- Product Image: [DISABLED — do not use image context]`;

  const titleContext = useTitle
    ? `- Current Title: "${product.title || 'Not provided'}"
- Description: "${product.description || 'Not provided'}"`
    : `- Current Title: [DISABLED — do not use]
- Description: [DISABLED — do not use]`;

  const sourceInstruction =
    useImage && useTitle
      ? `- Primary source: product image (treat as ground truth).
- Secondary source: current title and description (supporting context only).
- If they conflict, the image wins.`
      : useImage
        ? `- Source: product image ONLY.
- Identify visible attributes: product type, style, color, material, pattern, shape, intended use.
- The old title and description are DISABLED — do not reference them.`
        : `- Source: current title and description ONLY.
- The product image is DISABLED — do not reference it.`;

  const hasExamples = Array.isArray(input.examples) && input.examples.length > 0;

  const examplesBlock = hasExamples
    ? `
EXAMPLES — MANDATORY COMPLIANCE (not optional inspiration):
You MUST analyze these example titles and extract their exact pattern:
${input.examples.map((ex: string, i: number) => `  ${i + 1}. "${ex}"`).join('\n')}

From these examples, identify and replicate:
- Word order and structure (e.g. [Brand] [Material] [Product] [Attribute])
- Capitalization style (title case, sentence case, all caps, etc.)
- Whether brand/vendor is included and where
- Whether size, color, or material appears and in what position
- Punctuation patterns (commas, dashes, hyphens, etc.)
- Approximate length and level of detail

Your output MUST follow the same structural pattern as the examples above.
Treat the examples as a strict template — not a suggestion.`
    : ``;

  return `You are an expert Shopify SEO copywriter specializing in product titles.

Your task: Generate EXACTLY ONE optimized product title.

━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━
${imageContext}
${titleContext}
- Category: ${input.categoryName || 'Not provided'}
- Vendor: ${product.vendor || 'N/A'}
- Product Type: ${product.productType || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━
${sourceInstruction}
- Never invent brand names, model numbers, sizes, materials, or claims not visible or stated.
${examplesBlock}

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

━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES — STRICTLY ENFORCED
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Output the title and NOTHING else
- No pipe character ( | )
- No quotes around the title
- No explanations or commentary
- No emojis
- No markdown formatting
- One line only
`;
}