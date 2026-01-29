export const PRODUCT_META_TITLE_AI_QUERY = `
  query ProductMetaTitle($id: ID!) {
    product(id: $id) {
      id
      title
      seo {
        title
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
