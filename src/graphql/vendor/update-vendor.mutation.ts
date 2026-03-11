export const UPDATE_VENDOR_MUTATION = `
mutation updateVendor($input: ProductInput!) {
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