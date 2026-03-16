export const GET_PRODUCT_OPTIMIZATION_METAFIELDS_QUERY = `
query getProductMetafields($id: ID!) {
  product(id: $id) {
    id

    search_boost_keywords: metafield(
      namespace: "shopify--discovery--product_search_boost"
      key: "queries"
    ) {
      value
    }

    complementary_products: metafield(
      namespace: "shopify--discovery--product_recommendation"
      key: "complementary_products"
    ) {
      references(first: 20) {
        edges {
          node {
            ... on Product {
              id
              title
              featuredMedia {
                preview {
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }

    related_products: metafield(
      namespace: "shopify--discovery--product_recommendation"
      key: "related_products"
    ) {
      references(first: 20) {
        edges {
          node {
            ... on Product {
              id
              title
              featuredMedia {
                preview {
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }

  }
}
`;