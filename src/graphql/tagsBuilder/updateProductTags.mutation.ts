export const UPDATE_PRODUCT_TAGS_MUTATION = `
mutation updateProductTags($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      tags
    }
    userErrors {
      field
      message
    }
  }
}
  `