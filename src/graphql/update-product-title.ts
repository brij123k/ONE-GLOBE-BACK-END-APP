export const UPDATE_PRODUCT_TITLE_MUTATION = `
mutation updateProductTitle($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      title
    }
    userErrors {
      field
      message
    }
  }
}
`;
