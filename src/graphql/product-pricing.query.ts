export const PRODUCT_VARIANTS_PRICING_QUERY = `
query getProduct($id: ID!) {
  product(id: $id) {
    id
    title
    variants(first: 100) {
      edges {
        node {
          id
          title
          price
          compareAtPrice
          inventoryItem {
            unitCost {
              amount
            }
          }
          image {
            url
          }
        }
      }
    }
  }
}
`;
