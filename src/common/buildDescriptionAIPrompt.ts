export function buildDescriptionAIPrompt(
  product: any,
  input: any,
): string {
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
STRUCTURE & FORMAT
━━━━━━━━━━━━━━━━━━━━━━
- Description format: ${input.formatName}
- Use the following sections IN THIS EXACT ORDER:
${input.blocks.map((b: string) => `- ${b}`).join('\n')}

RULES FOR EACH SECTION:
- Each section MUST start with an <h2> heading
- The heading text should be a human-friendly version of the block name
- Content must be inside <p>, <ul>, <li> where appropriate
- Use bullet lists (<ul><li>) for features or specifications
- Do NOT skip any section
- Do NOT add extra sections

━━━━━━━━━━━━━━━━━━━━━━
SEO & CONTENT RULES
━━━━━━━━━━━━━━━━━━━━━━
- Target length: approximately ${input.targetLength} words (±10%)
- Tone: ${input.tone || 'Professional'}
- Include these keywords naturally:
  ${input.includeKeywords?.length ? input.includeKeywords.join(', ') : 'None'}
- Do NOT use these keywords:
  ${input.excludeKeywords?.length ? input.excludeKeywords.join(', ') : 'None'}

━━━━━━━━━━━━━━━━━━━━━━
STRICT OUTPUT INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━
- Output ONLY valid HTML
- No markdown
- No explanations
- No emojis
- No quotes
- No <html>, <head>, or <body> tags
- Use semantic, Shopify-safe HTML only
- The output MUST be directly usable as product description HTML
`;
}
