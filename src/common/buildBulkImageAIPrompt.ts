export function buildBulkImageAIPrompt({
  productTitle,
  vendor,
  variantTitles,
  existingAlt,
}: {
  productTitle: string;
  vendor: string;
  variantTitles: string[];
  existingAlt?: string;
}) {
  return `
You are an expert Shopify SEO and accessibility specialist.

Generate a clear, SEO-friendly ALT text for a product image.

Rules:
- Describe the image naturally.
- Use product title and vendor if relevant.
- Use variant details ONLY if image belongs to variants.
- Do NOT keyword stuff.
- Max length: 125 characters.
- Output ONLY the ALT text (no quotes).

Context:
Product Title: ${productTitle}
Vendor: ${vendor}
Variants: ${variantTitles.length ? variantTitles.join(', ') : 'N/A'}
Existing ALT: ${existingAlt || 'None'}
`;
}
