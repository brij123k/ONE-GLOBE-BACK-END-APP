export const COLLECTIONS_QUERY = `
query getCollections($first: Int!, $after: String) {
  collections(first: $first, after: $after) {
    edges {
      node {
        id
        title
        handle
        productsCount { count }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;
