export const VENDORS_QUERY = `
query getVendors($first: Int!, $after: String) {
  products(first: $first, after: $after) {
    edges {
      node {
        vendor
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;
