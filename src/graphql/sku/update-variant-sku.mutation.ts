export const UPDATE_VARIANT_SKU_MUTATION = `
mutation inventoryItemUpdate($id: ID!, $input: InventoryItemInput!) {
  inventoryItemUpdate(id: $id, input: $input) {
    inventoryItem {
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