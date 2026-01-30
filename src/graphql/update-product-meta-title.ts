export const UPDATE_PRODUCT_META_MUTATION = `
  mutation UpdateProductMeta($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        seo {
          title
          description
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
