export function buildDescriptionAIPrompt(
  product: any,
  input: any,
): string {

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
Existing Description: "${product.description}"
Vendor: ${product.vendor || 'N/A'}
Product Type: ${product.productType || 'N/A'}

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