export const COLLECTIONS_QUERY = `
query getCollections($first: Int!) {
  collections(first: $first) {
    edges {
      node {
        id
        title
        handle
        productsCount
      }
    }
  }
}
`;