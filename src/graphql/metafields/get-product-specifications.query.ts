export const GET_PRODUCT_SPECIFICATIONS_QUERY = `
query getProductSpecifications($id: ID!) {
  product(id: $id) {
    id
     metafield(namespace: "specification", key: "specification") {
      id
      value
      type
    }
  }
}
`;