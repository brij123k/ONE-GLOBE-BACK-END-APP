export const PRODUCTS_COLLECTION_BUILDER_QUERY = `
query getProducts($first: Int!, $after: String) {
  products(first: $first, after: $after) {
    edges {
      node {
        id
        title
        productType
        vendor
        tags
        featuredMedia {
          preview {
            image {
              url
            }
          }
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