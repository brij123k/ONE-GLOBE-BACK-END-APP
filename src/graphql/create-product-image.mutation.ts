export const UPDATE_IMAGE_NAME_MUTATION = `
mutation fileUpdate($files: [FileUpdateInput!]!) {
  fileUpdate(files: $files) {
    files {
      ... on MediaImage {
        id
        alt
        image {
          url
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;