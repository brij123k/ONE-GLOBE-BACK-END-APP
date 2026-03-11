export const PRODUCT_TYPE_AI_QUERY = `
query getProductTypeAI($id: ID!) {
  product(id: $id) {
    id
    title
    productType
    vendor
    tags
  }
}
`;