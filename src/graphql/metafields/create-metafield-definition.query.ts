export const CREATE_METAFIELD_DEFINITION = `
mutation createMetafieldDefinition($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
      id
      name
      namespace
      key
      type {
        name
      }
      access {
        storefront
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;