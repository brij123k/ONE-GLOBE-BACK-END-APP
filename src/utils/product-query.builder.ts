export function buildProductSearchQuery(params: any): {
  query: string;
  categories: string[];
} {
  const filters: string[] = [];

  const normalizeArray = (value: any): string[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value.map(v => String(v).trim()).filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map(v => v.trim())
        .filter(Boolean);
    }

    return [];
  };

  const escapeValue = (val: string) =>
    val.replace(/"/g, '\\"');


  // ---------- COLLECTION ----------
const collections = normalizeArray(params.collections);

if (collections.length) {
  const c = collections
    .map(id => {
      // Extract numeric ID if gid format
      const numericId = id.includes("gid://")
        ? id.replace("gid://shopify/Collection/", "")
        : id;

      return `collection_id:${numericId}`;
    })
    .join(" OR ");

  filters.push(`(${c})`);
}
  // ---------- TEXT ----------
  if (params.title) {
    filters.push(`title:*${escapeValue(params.title)}*`);
  }

  if (params.handle) {
    filters.push(`handle:${escapeValue(params.handle)}`);
  }

  // ---------- MULTI ----------
  const vendors = normalizeArray(params.vendors);
  if (vendors.length) {
    const v = vendors.map(x => `vendor:"${escapeValue(x)}"`).join(" OR ");
    filters.push(`(${v})`);
  }

  const productTypes = normalizeArray(params.productTypes);
  if (productTypes.length) {
    const v = productTypes.map(x => `product_type:"${escapeValue(x)}"`).join(" OR ");
    filters.push(`(${v})`);
  }

  const tags = normalizeArray(params.tags);
  if (tags.length) {
    const v = tags.map(x => `tag:"${escapeValue(x)}"`).join(" OR ");
    filters.push(`(${v})`);
  }

  // ---------- STATUS ----------
  if (params.status) {
    filters.push(`status:${params.status}`);
  }

  // ---------- DATE ----------
  if (params.createdAfter) {
    filters.push(`created_at:>=${params.createdAfter}`);
  }

  if (params.updatedAfter) {
    filters.push(`updated_at:>=${params.updatedAfter}`);
  }

  // ---------- PRICE ----------
 if (params.priceMin !== undefined && params.priceMin !== null) {
  const min = Number(params.priceMin);
  if (!isNaN(min)) {
    filters.push(`price:>=${min}`);
  }
}

if (params.priceMax !== undefined && params.priceMax !== null) {
  const max = Number(params.priceMax);
  if (!isNaN(max)) {
    filters.push(`price:<=${max}`);
  }
}

// ---------- STOCK ----------
if (params.stockMin !== undefined && params.stockMin !== null) {
  const min = Number(params.stockMin);
  if (!isNaN(min)) {
    filters.push(`inventory_total:>=${min}`);
  }
}

if (params.stockMax !== undefined && params.stockMax !== null) {
  const max = Number(params.stockMax);
  if (!isNaN(max)) {
    filters.push(`inventory_total:<=${max}`);
  }
}

  const categories = normalizeArray(params.categories);

  return {
    query: filters.join(" AND "),
    categories,
  };
}