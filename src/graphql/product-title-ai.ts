export const PRODUCT_TITLE_AI_QUERY = `
query getProduct($id: ID!) {
  product(id: $id) {
    id
    title
    vendor
    productType
    description
    featuredMedia {
      ... on MediaImage {
        preview {
          image {
            url
          }
        }
      }
    }
  }
}
`;
