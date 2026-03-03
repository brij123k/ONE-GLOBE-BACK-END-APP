export const PRODUCTS_BY_IDS_QUERY = `
query getProductsByIds($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Product {
      id
      title
      handle
      variants(first: 100) {
        edges {
          node {
            id
            title
            sku
            price
            inventoryQuantity
            image {
              url
            }
          }
        }
      }
    }
  }
}
`;