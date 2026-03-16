export const GET_PRODUCT_BASE_DATA_QUERY = `
query getProductBaseData($id: ID!) {
  product(id: $id) {
    id
    title
    vendor
    productType
    tags

    collections(first: 10) {
      edges {
        node {
          id
          handle
        }
      }
    }
  }
}
`;