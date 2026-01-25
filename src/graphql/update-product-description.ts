export const UPDATE_PRODUCT_DESCRIPTION_MUTATION = `
mutation updateProductDescription($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      descriptionHtml
    }
    userErrors {
      field
      message
    }
  }
}
`;
