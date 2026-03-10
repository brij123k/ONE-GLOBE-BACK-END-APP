export const UPDATE_PRODUCT_TYPE_MUTATION = `
mutation updateProductType($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      productType
    }
    userErrors {
      field
      message
    }
  }
}
`;