export const PRODUCT_META_HANDLE_AI_QUERY = `
  query ProductHandle($id: ID!) {
    product(id: $id) {
      id
      title
      handle
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
