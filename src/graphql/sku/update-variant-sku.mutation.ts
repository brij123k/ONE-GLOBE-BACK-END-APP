export const UPDATE_VARIANT_SKU_MUTATION = `
mutation updateVariantSKU($input: ProductVariantInput!) {
  productVariantUpdate(input: $input) {
    productVariant {
      id
      sku
    }
    userErrors {
      field
      message
    }
  }
}
`;