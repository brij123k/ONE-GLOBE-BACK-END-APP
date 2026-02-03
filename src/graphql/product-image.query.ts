export const PRODUCT_WITH_IMAGES_QUERY = `
query ProductWithImages($id: ID!) {
  product(id: $id) {
    id
    title
    vendor
    productType
    handle
    images(first: 50) {
      edges {
        node {
          id
          altText
          width
          height
          position
          originalSrc
        }
      }
    }
  }
}
`;
