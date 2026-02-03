export const PRODUCT_IMAGES_WITH_VARIANTS_QUERY = `
query ProductImagesWithVariants($id: ID!) {
  product(id: $id) {
    id
    title
    vendor
    images(first: 50) {
      edges {
        node {
          id           
          altText
          originalSrc
        }
      }
    }
    variants(first: 50) {
      edges {
        node {
          id
          title
          sku
          image {
            id        
          }
        }
      }
    }
  }
}

`;
