export const UPDATE_PRODUCT_DETAIL_MUTATION = `
mutation UpdateProductDetail($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      title
      descriptionHtml
      handle
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
