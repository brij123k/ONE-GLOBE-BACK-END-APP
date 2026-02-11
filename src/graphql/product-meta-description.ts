export const PRODUCT_META_DESCRIPTION_AI_QUERY = `
  query ProductMetaDescription($id: ID!) {
    product(id: $id) {
      id
      title
      description
      seo {
        title
        description
      }
      featuredMedia {
        preview {
          image {
            url
          }
        }
      }
    }
  }
`;
