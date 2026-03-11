export const VENDOR_AI_QUERY = `
query getVendorAI($id: ID!) {
  product(id: $id) {
    id
    title
    productType
    vendor
    tags
  }
}
`;