export function buildDescriptionAIPrompt(
  product: any,
  input: any,
): string {

  const imageUrl = product.featuredMedia?.preview?.image?.url || 'No image found';
  const useImage = input.image !== false;
  const useDescription = input.description !== false;
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

  const blocksSection = input.blocks
    .map((block: string) => {
      const blockInput = input.blockInputs?.[block];

      if (!blockInput) {
        return `BLOCK: ${block}`;
      }

      return `BLOCK: ${block}
BLOCK INSTRUCTIONS:
${blockInput}`;
    })
    .join('\n\n');

  return `
You are an expert Shopify product description copywriter.

Your task is to generate a HIGH-QUALITY, SEO-OPTIMIZED PRODUCT DESCRIPTION
using CLEAN, VALID HTML that can be directly saved in Shopify.

━━━━━━━━━━━━━━━━━━━━━━
PRODUCT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━
Title: "${product.title}"
${descriptionContext}
Vendor: ${product.vendor || 'N/A'}
Product Type: ${product.productType || 'N/A'}
${imageContext}

━━━━━━━━━━━━━━━━━━━━━━
SOURCE INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━
${sourceInstruction}
- If enabled sources conflict, prioritize the image.
- Do not invent brand names, model numbers, sizes, materials, or claims that are not visible or provided.

━━━━━━━━━━━━━━━━━━━━━━
DESCRIPTION STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━
Description format: ${input.formatName}

Generate the description using the following blocks
IN THIS EXACT ORDER.

${blocksSection}

RULES FOR EACH BLOCK:
- Each block MUST start with an <h2> heading
- The heading should be a natural human-readable version of the block name
- Content must be inside <p>, <ul>, <li> where appropriate
- Use bullet lists (<ul><li>) for features or specifications
- Follow block instructions when provided
- Do NOT skip any block
- Do NOT add extra blocks

━━━━━━━━━━━━━━━━━━━━━━
SEO & CONTENT RULES
━━━━━━━━━━━━━━━━━━━━━━
Target length: approximately ${input.targetLength} words (±10%)

Tone: ${input.tone || 'Professional'}

Include these keywords naturally:
${input.includeKeywords?.length ? input.includeKeywords.join(', ') : 'None'}

Do NOT use these keywords:
${input.excludeKeywords?.length ? input.excludeKeywords.join(', ') : 'None'}

Brand Context:
${input.brandContext || 'None'}

━━━━━━━━━━━━━━━━━━━━━━
STRICT OUTPUT INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━
- Output ONLY valid HTML
- No markdown
- No explanations
- No emojis
- No quotes
- No <html>, <head>, or <body> tags
- Use semantic Shopify-safe HTML only
- Output must be ready to save directly as a Shopify product description
`;
}