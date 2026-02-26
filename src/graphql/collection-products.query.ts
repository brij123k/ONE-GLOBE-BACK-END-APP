// export const COLLECTION_PRODUCTS_QUERY = `
// query getCollectionProducts(
//   $collectionId: ID!,
//   $first: Int!,
//   $after: String
// ) {
//   collection(id: $collectionId) {
//     products(first: $first, after: $after) {
//     edges {
//       cursor
//       node {
//         id
//         title
//         handle
//         status
//         vendor
//         productType
//         tags
//         createdAt
//         publishedAt
//         updatedAt
//         totalInventory
//         templateSuffix

//         seo {
//           title
//           description
//         }

//         description
//         descriptionHtml

//         featuredMedia {
//           ... on MediaImage {
//             id
//             preview {
//               image {
//                 url
//               }
//             }
//           }
//         }

//         mediaCount {
//           count
//           precision
//         }

//         options {
//           id
//           name
//           position
//           values

//           optionValues {
//             id
//             name
//             linkedMetafieldValue
//           }

//           linkedMetafield {
//             namespace
//             key
//           }
//         }

//         priceRangeV2 {
//           minVariantPrice { amount currencyCode }
//           maxVariantPrice { amount currencyCode }
//         }

//         variants(first: 50) {
//           edges {
//             node {
//               id
//               title
//               sku
//               barcode
//               price
//               compareAtPrice
//               taxable
//               taxCode
//               inventoryQuantity
//               inventoryPolicy
//               position
//               createdAt
//               updatedAt

//               selectedOptions {
//                 name
//                 value
//                 optionValue {
//                   id
//                   name
//                   linkedMetafieldValue
//                 }
//               }

//               deliveryProfile {
//                 id
//                 name
//               }

//               inventoryItem {
//                 id
//                 tracked
//                 requiresShipping
//                 countryCodeOfOrigin
//                 provinceCodeOfOrigin
//                 harmonizedSystemCode

//                 unitCost {
//                   amount
//                   currencyCode
//                 }

//                 locationsCount {
//                   count
//                   precision
//                 }

//                 inventoryLevels(first: 10) {
//                   edges {
//                     node {
//                       location {
//                         id
//                         fulfillmentService {
//                           id
//                           handle
//                           serviceName
//                         }
//                       }
//                     }
//                   }
//                 }

//                 measurement {
//                   weight {
//                     value
//                     unit
//                   }
//                 }
//               }

//               unitPriceMeasurement {
//                 quantityValue
//                 quantityUnit
//                 referenceValue
//                 referenceUnit
//               }
//             }
//           }
//           pageInfo {
//             hasNextPage
//             endCursor
//           }
//         }

//         variantsCount {
//           count
//           precision
//         }
//       }
//     }

//     pageInfo {
//       hasNextPage
//       endCursor
//     }
//   }
//   }
// }
// `
export const COLLECTION_PRODUCTS_QUERY = `
query getCollectionProducts(
  $collectionId: ID!
  $first: Int
  $after: String
  $last: Int
  $before: String
) {
  collection(id: $collectionId) {
    products(
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
          totalInventory
          createdAt
          updatedAt

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
            maxVariantPrice { amount currencyCode }
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
}
`;