 export const PRODUCTS_QUERY = `
query Products($query: String!, $first: Int!, $after: String) {
  products(first: $first, after: $after, query: $query) {
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
        publishedAt
        updatedAt
        totalInventory
        templateSuffix

        seo {
          title
          description
        }

        category {
          id
          name
          fullName
        }

        description
        descriptionHtml

        featuredMedia {
          ... on MediaImage {
            id
            preview {
              image {
                url
              }
            }
          }
        }

        mediaCount {
          count
          precision
        }

        options {
          id
          name
          position
          values

          optionValues {
            id
            name
            linkedMetafieldValue
          }

          linkedMetafield {
            namespace
            key
          }
        }

        priceRangeV2 {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }

        variants(first: 50) {
          edges {
            node {
              id
              title
              sku
              barcode
              price
              compareAtPrice
              taxable
              taxCode
              inventoryQuantity
              inventoryPolicy
              position
              createdAt
              updatedAt

              selectedOptions {
                name
                value
                optionValue {
                  id
                  name
                  linkedMetafieldValue
                }
              }

              deliveryProfile {
                id
                name
              }

              inventoryItem {
                id
                tracked
                requiresShipping
                countryCodeOfOrigin
                provinceCodeOfOrigin
                harmonizedSystemCode

                unitCost {
                  amount
                  currencyCode
                }

                locationsCount {
                  count
                  precision
                }

                inventoryLevels(first: 10) {
                  edges {
                    node {
                      location {
                        id
                        fulfillmentService {
                          id
                          handle
                          serviceName
                        }
                      }
                    }
                  }
                }

                measurement {
                  weight {
                    value
                    unit
                  }
                }
              }

              unitPriceMeasurement {
                quantityValue
                quantityUnit
                referenceValue
                referenceUnit
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }

        variantsCount {
          count
          precision
        }
      }
    }

    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`
