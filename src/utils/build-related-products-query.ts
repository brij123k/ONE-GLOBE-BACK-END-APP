export function buildRelatedProductsQuery(product: any) {

  const parts: string[] = [];

  if (product.vendor) {
    parts.push(`vendor:${product.vendor}`);
  }

  if (product.productType) {
    parts.push(`product_type:${product.productType}`);
  }

  if (product.tags?.length) {
    const tagQuery = product.tags
      .slice(0, 5)
      .map(t => `tag:${t}`)
      .join(" OR ");

    parts.push(`(${tagQuery})`);
  }

  if (product.collections?.edges?.length) {
    const collectionQuery = product.collections.edges
      .map(e => `collection_id:${e.node.id.split("/").pop()}`)
      .join(" OR ");

    parts.push(`(${collectionQuery})`);
  }

  return parts.join(" OR ");
}