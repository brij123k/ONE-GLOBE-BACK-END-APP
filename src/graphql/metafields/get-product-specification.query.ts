export const CHECK_SPECIFICATION_DEFINITION_QUERY = `
query getMetafieldDefinitions($first: Int!, $after: String) {
  metafieldDefinitions(first: $first, after: $after, ownerType: PRODUCT) {
    edges {
      node {
        id
        namespace
        key
        name
        type {
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;