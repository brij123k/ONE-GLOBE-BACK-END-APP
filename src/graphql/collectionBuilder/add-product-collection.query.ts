export const ADD_PRODUCTS_TO_COLLECTION_MUTATION = `
mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
  collectionAddProducts(id: $id, productIds: $productIds) {
    collection {
      id
    }
    userErrors {
      field
      message
    }
  }
}
`;