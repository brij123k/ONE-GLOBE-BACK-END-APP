export const SET_PRODUCT_METAFIELD = `
mutation setProductMetafield($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields {
      id
      key
      namespace
      value
    }
    userErrors {
      field
      message
    }
  }
}
`;