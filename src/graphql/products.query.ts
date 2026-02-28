export const PRODUCTS_QUERY = `
query Products(
  $query: String
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  products(
    query: $query
    first: $first
    after: $after
    last: $last
    before: $before
  ) {
    edges {
      cursor
      node {
        id
        title
        descriptionHtml
        description
        handle
        status
        vendor
        productType
        tags
        createdAt
        updatedAt
        totalInventory
          seo {
        title
        description
      }
        featuredMedia {
          ... on MediaImage {
            preview {
              image { url }
            }
          }
        }
          variants(first: 1) {
            edges {
              node {
                id
                sku
                price
                inventoryQuantity
              }
            }
          }

        priceRangeV2 {
          minVariantPrice { amount currencyCode }
        }

        variants(first: 1) {
          edges { node { sku } }
        }
      }
    }

    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }

  productsCount(query: $query) {
    count
  }
}
`;