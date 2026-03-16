export const SEARCH_RELATED_PRODUCTS_QUERY = `
query searchProducts($query: String!, $first: Int!) {
  products(first: $first, query: $query) {
    edges {
      node {
        id
        title
        vendor
        productType
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
  }
}
`;