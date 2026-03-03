export const PRODUCTIDS_QUERY = `
query Products(
  $query: String
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  products(
    query: $query
    first: $first
    after: $after
    last: $last
    before: $before
  ) {
    edges {
      cursor
      node {
        id
      }
    }

    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
`;