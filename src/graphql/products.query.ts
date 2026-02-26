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
        handle
        status
        vendor
        productType
        tags
        createdAt
        updatedAt
        totalInventory

        featuredMedia {
          ... on MediaImage {
            preview {
              image {
                url
              }
            }
          }
        }

        priceRangeV2 {
          minVariantPrice { amount currencyCode }
        }

        variants(first: 1) {
          edges {
            node {
              sku
            }
          }
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
}
`;