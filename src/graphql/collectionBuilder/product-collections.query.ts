export const PRODUCT_COLLECTIONS_QUERY = `
query getProductCollections($id: ID!) {
  product(id: $id) {
    id
    collections(first: 50) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
}
`;