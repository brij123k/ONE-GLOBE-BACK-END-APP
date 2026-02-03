export const UPDATE_PRODUCT_IMAGES_ALT_MUTATION = `
mutation UpdateProductImagesAlt(
  $productId: ID!,
  $mediaId: ID!,
  $alt: String!
) {
  productUpdateMedia(
    productId: $productId,
    media: [
      {
        id: $mediaId
        alt: $alt
      }
    ]
  ) {
    media {
      id
      alt
      status
    }
    mediaUserErrors {
      field
      message
    }
  }
}
`;
