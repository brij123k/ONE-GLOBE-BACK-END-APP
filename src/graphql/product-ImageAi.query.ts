export const PRODUCT_IMAGE_AI_QUERY = `
query getProductImages($id: ID!) {
  product(id: $id) {
    id
    title
    vendor
    productType
    media(first: 50) {
    edges {
      node {
        id
        mediaContentType
        ... on MediaImage {
          id
          alt
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