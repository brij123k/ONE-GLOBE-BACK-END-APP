export const CREATE_COLLECTION_MUTATION = `
mutation createCollection($input: CollectionInput!) {
  collectionCreate(input: $input) {
    collection {
      id
      handle
    }
    userErrors {
      field
      message
    }
  }
}
`;