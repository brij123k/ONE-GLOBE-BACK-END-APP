export const CREATE_PRODUCT_IMAGE_MUTATION = `
mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
  productCreateMedia(productId: $productId, media: $media) {
    media {
      id
      alt
    }
    mediaUserErrors {
      field
      message
    }
  }
}
`;