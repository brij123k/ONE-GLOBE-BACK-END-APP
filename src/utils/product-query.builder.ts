export function buildProductSearchQuery(params: any): string {
  const filters: string[] = [];

  if (params.title) filters.push(`title:${params.title}`);
  if (params.handle) filters.push(`handle:${params.handle}`);
  if (params.description) filters.push(`description:${params.description}`);
  if (params.vendors) filters.push(`vendor:${params.vendors}`);
  if (params.productTypes) filters.push(`product_type:${params.productTypes}`);
  if (params.tags) filters.push(`tag:${params.tags}`);
  if (params.category) filters.push(`category:${params.category}`);
  if (params.status) filters.push(`status:${params.status}`);
  if (params.createdAfter) filters.push(`created_at:>=${params.createdAfter}`);
  if (params.publishedAfter) filters.push(`published_at:>=${params.publishedAfter}`);
  if (params.updatedAfter) filters.push(`updated_at:>=${params.updatedAfter}`);

  return filters.join(' AND ');
}
