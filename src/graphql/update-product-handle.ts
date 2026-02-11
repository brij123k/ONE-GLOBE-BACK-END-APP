export const UPDATE_PRODUCT_Handle_MUTATION = `
  mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      handle
    }
    userErrors {
      field
      message
    }
  }
}

`;
