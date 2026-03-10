export const UPDATE_PRODUCT_VENDOR_MUTATION = `
mutation updateProductVendor($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      vendor
    }
    userErrors {
      field
      message
    }
  }
}
`;