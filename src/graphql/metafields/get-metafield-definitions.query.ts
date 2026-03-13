export const GET_METAFIELD_DEFINITIONS = `
query {
  metafieldDefinitions(first: 100, ownerType: PRODUCT) {
    edges {
      node {
        id
        name
        namespace
        key
        type {
          name
        }
      }
    }
  }
}
`;