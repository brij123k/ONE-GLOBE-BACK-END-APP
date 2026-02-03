export const PRODUCT_BY_ID_QUERY = `
query getProduct($id: ID!) {
  product(id: $id) {
    id
    title
    descriptionHtml
    description
    handle
    status
    vendor
    productType
    tags
    seo {
          title
          description
        }
    featuredMedia {
      ... on MediaImage {
        preview {
          image {
            url
          }
        }
      }
    }
    images(first: 10) {
      edges {
        node {
          id
          altText
          originalSrc
          width
          height
        }
      }
    }
  }
}
`;
