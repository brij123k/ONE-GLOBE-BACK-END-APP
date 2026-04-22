export function buildDescriptionAIPrompt(product: any, input: any): string {
  const imageUrl = product.featuredMedia?.preview?.image?.url || 'No image';
  const useImage = input.image !== false;
  const useDescription = input.description !== false;

  const imageContext = useImage
    ? `Image: ${imageUrl}`
    : `Image: ignore`;

  const descriptionContext = useDescription
    ? `Old Desc: "${product.description || 'None'}"`
    : `Old Desc: ignore`;

  const sourceInstruction =
    useImage && useDescription
      ? `Use both. Image > text.`
      : useImage
        ? `Use image only.`
        : `Use text only.`;

  const blocksSection = input.blocks
    .map((block: string) => {
      const blockInput = input.blockInputs?.[block];
      return blockInput
        ? `BLOCK: ${block}\n${blockInput}`
        : `BLOCK: ${block}`;
    })
    .join('\n');

  return `
You are a Shopify product copywriter. Write SEO-ready HTML description.

PRODUCT:
Title: ${product.title}
Vendor: ${product.vendor || 'N/A'}
Type: ${product.productType || 'N/A'}
${descriptionContext}
${imageContext}

SOURCE:
${sourceInstruction}
No guessing missing facts.

FORMAT:
${input.formatName}
Use blocks in order:

${blocksSection}

BLOCK RULES:
- Each starts with <h2>
- Use <p> for text, <ul><li> for features/specs
- Do not skip/add blocks

SEO:
Length: ~${input.targetLength} words
Tone: ${input.tone || 'Professional'}
Include: ${input.includeKeywords?.join(', ') || 'None'}
Exclude: ${input.excludeKeywords?.join(', ') || 'None'}
Brand: ${input.brandContext || 'None'}

OUTPUT:
Only clean HTML (Shopify-safe)
No markdown, no extra text
`;
}