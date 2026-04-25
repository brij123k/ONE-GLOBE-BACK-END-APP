export const CHECK_METAFIELD_DEFINITION_QUERY = `
query getMetafieldDefinitions($first: Int!, $after: String, $ownerType: MetafieldOwnerType!) {
  metafieldDefinitions(first: $first, after: $after, ownerType: $ownerType) {
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
