export const UPDATE_IMAGE_ALT_MUTATION = `
mutation fileUpdate($files: [FileUpdateInput!]!) {
  fileUpdate(files: $files) {
    files {
      id
      alt
    }
    userErrors {
      field
      message
    }
  }
}
`;