import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Shop, ShopDocument } from '../../schema/shop.schema';
import { CreateShopDto } from '../../dto/shop/create-shop.dto';
import { buildProductSearchQuery } from 'src/utils/product-query.builder';
import { COLLECTION_PRODUCTS_QUERY } from 'src/graphql/collection-products.query';
import { PRODUCTS_QUERY } from 'src/graphql/products.query';
import { COLLECTIONS_QUERY } from 'src/graphql/collections.query';
import { CollectionResponseDto } from 'src/dto/collection-response.dto';
import { groqClient } from 'src/config/groq.config';

@Injectable()
export class ShopService {
  private readonly startupAuditCacheTtlMs = 6 * 60 * 60 * 1000;

  constructor(
    @InjectModel(Shop.name)
    private shopModel: Model<ShopDocument>,
  ) { }

  async createOrUpdateShop(data: CreateShopDto) {
    return this.shopModel.findOneAndUpdate(
      { shopDomain: data.shopDomain },
      { ...data, isActive: true },
      { upsert: true, new: true },
    );
  }

  async exchangeCodeForToken(shop: string, code: string) {
    const response = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      },
    );

    return response.data.access_token;
  }

  async getShopDetails(shop: string, accessToken: string) {
    const response = await axios.get(
      `https://${shop}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      },
    );

    return response.data.shop;
  }


  private async getShop(shopId: string) {
    const shop = await this.shopModel.findById(shopId).lean();
    if (!shop) throw new UnauthorizedException('Invalid shop');
    return shop;
  }

  private async getShopByName(shopName: string) {
    const value = shopName.trim();
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const shop = await this.shopModel.findOne({
      $or: [
        { shopName: new RegExp(`^${escaped}$`, 'i') },
        { shopDomain: new RegExp(`^${escaped}$`, 'i') },
        { shopDomain: new RegExp(escaped, 'i') },
      ],
    }).lean();

    if (!shop) {
      throw new BadRequestException(`Shop not found for "${shopName}"`);
    }

    return shop;
  }

  private isFreshStartupAudit(shop: any) {
    if (!shop?.startupSeoAudit || !shop?.startupSeoAuditGeneratedAt) {
      return false;
    }

    const generatedAt = new Date(shop.startupSeoAuditGeneratedAt).getTime();
    if (Number.isNaN(generatedAt)) return false;

    return Date.now() - generatedAt < this.startupAuditCacheTtlMs;
  }

  private async shopifyRequest(
    shopDomain: string,
    accessToken: string,
    query: string,
    variables: any,
  ) {
    const url = `https://${shopDomain}/admin/api/2026-01/graphql.json`;

    const { data } = await axios.post(
      url,
      { query, variables },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      },
    );

    if (data.errors) throw data.errors;
    return data.data;
  }

async getProducts(shopId: string, params: any) {
  const shop = await this.getShop(shopId);

  const limit = Number(params.limit) || 50;
  const after = params.after || null;
  const before = params.before || null;

  const { query } = buildProductSearchQuery(params);

  const variables: any = { query };

  if (before) {
    variables.last = limit;
    variables.before = before;
  } else {
    variables.first = limit;
    variables.after = after;
  }

  const data = await this.shopifyRequest(
    shop.shopDomain,
    shop.accessToken,
    PRODUCTS_QUERY,
    variables,
  );

  const totalCount = data.productsCount?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    products: data.products.edges,
    pageInfo: data.products.pageInfo,
    totalCount,
    totalPages,
  };
}

  async getVendors(shopId: string) {
    const shop = await this.getShop(shopId);

    const query = `
    query getVendors($first: Int!, $after: String) {
      productVendors(first: $first, after: $after) {
        edges {
          node
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    let cursor = null;
    const vendors = new Set<string>();

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        query,
        { first: 250, after: cursor },
      );

      data.productVendors.edges.forEach(e => vendors.add(e.node));

      if (!data.productVendors.pageInfo.hasNextPage) break;
      cursor = data.productVendors.pageInfo.endCursor;
    }

    return {
      count: vendors.size,
      vendors: Array.from(vendors).sort(),
    };
  }

  async getProductTypes(shopId: string) {
    const shop = await this.getShop(shopId);

    const query = `
    query getProductTypes($first: Int!, $after: String) {
      productTypes(first: $first, after: $after) {
        edges {
          node
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    let cursor = null;
    const types = new Set<string>();

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        query,
        { first: 250, after: cursor },
      );

      data.productTypes.edges.forEach(e => {
        if (e.node) types.add(e.node);
      });

      if (!data.productTypes.pageInfo.hasNextPage) break;
      cursor = data.productTypes.pageInfo.endCursor;
    }

    return {
      count: types.size,
      productTypes: Array.from(types).sort(),
    };
  }

  async getProductTags(shopId: string) {
    const shop = await this.getShop(shopId);

    const query = `
    query getProductTags($first: Int!, $after: String) {
      productTags(first: $first, after: $after) {
        edges {
          node
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    let cursor = null;
    const tags = new Set<string>();

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        query,
        { first: 250, after: cursor },
      );

      data.productTags.edges.forEach(e => {
        if (e.node) tags.add(e.node);
      });

      if (!data.productTags.pageInfo.hasNextPage) break;
      cursor = data.productTags.pageInfo.endCursor;
    }

    return {
      count: tags.size,
      tags: Array.from(tags).sort(),
    };
  }

  async getCategories(shopId: string) {
    const shop = await this.getShop(shopId);

    const query = `
    query getCollections($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        edges {
          node {
            id
            title
            handle
            productsCount {
              count
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

    let cursor = null;
    const categories: any[] = [];

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        query,
        { first: 250, after: cursor },
      );

      data.collections.edges.forEach(e => {
        categories.push({
          id: e.node.id,
          title: e.node.title,
          handle: e.node.handle,
          productsCount: e.node.productsCount?.count || 0,
        });
      });

      if (!data.collections.pageInfo.hasNextPage) break;
      cursor = data.collections.pageInfo.endCursor;
    }

    return {
      count: categories.length,
      categories,
    };
  }

  async getCollections(shopId: string) {
    const shop = await this.getShop(shopId);

    let cursor: string | null = null;
    const collections: CollectionResponseDto[] = [];

    while (true) {
      const data = await this.shopifyRequest(
        shop.shopDomain,
        shop.accessToken,
        COLLECTIONS_QUERY,
        { first: 250, after: cursor }, // 🔥 increased from 50 → 250
      );

      const edges = data?.collections?.edges || [];

      for (const edge of edges) {
        const node = edge?.node;
        if (!node) continue;

        collections.push({
          id: node.id,
          title: node.title,
          handle: node.handle,
          productsCount: node.productsCount?.count ?? 0,
        });
      }

      if (!data?.collections?.pageInfo?.hasNextPage) break;
      cursor = data.collections.pageInfo.endCursor;
    }

    // Optional: sort alphabetically
    collections.sort((a, b) => a.title.localeCompare(b.title));

    return {
      count: collections.length,
      collections,
    };
  }

  private parseJsonResponse(raw: string) {
    if (!raw?.trim()) {
      throw new BadRequestException('AI returned an empty response');
    }

    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
      throw new BadRequestException('AI did not return valid JSON');
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new BadRequestException('AI returned malformed JSON');
    }
  }

  private buildSeoAuditPrompt(
    storeContext: any,
    competitorContext: any,
  ): string {
    const competitors = Array.isArray(competitorContext?.competitors)
      ? competitorContext.competitors
      : [];

    const prompt = `You are a world-class SEO strategist, AEO
(Answer Engine Optimization) expert, GEO
(Generative Engine Optimization) specialist,
and technical SEO consultant with over 15 years
of experience in ranking ecommerce websites on
Google, AI search engines, and generative AI
platforms.

Your task is to perform a COMPLETE, DEEP-DIVE
SEO AUDIT of my ecommerce website from scratch.

Website Details:
- Website URL: ${storeContext.websiteUrl}
- Brand Name: ${storeContext.brandName}
- Business Type: ${storeContext.businessType}
- Target Market: ${storeContext.targetMarket}
- Main Products: ${storeContext.mainProducts.join(', ')}
- Main Competitors: ${competitors
      .map((competitor: any) => `${competitor.name} (${competitor.url})`)
      .join(', ')}

Store Snapshot:
${JSON.stringify(storeContext, null, 2)}

Competitor Research:
${JSON.stringify(competitorContext, null, 2)}

Please analyse and provide:

1. TECHNICAL SEO AUDIT
- Page speed & Core Web Vitals analysis
- Mobile responsiveness check
- Crawlability & indexing issues
- Sitemap & robots.txt review
- SSL & security check
- JavaScript rendering issues
- Broken links & redirect issues
- Canonical tag issues
- Duplicate content issues
- Schema markup analysis

2. ON-PAGE SEO AUDIT
- Title tags & meta descriptions
- H1, H2, H3 heading structure
- Keyword usage & density
- Image alt text optimization
- Internal linking strategy
- URL structure analysis
- Content quality & depth
- Thin content pages

3. HOMEPAGE SEO ANALYSIS
- Title tag optimization
- Meta description quality
- H1 tag presence & quality
- Hero banner content & keywords
- Above the fold content
- CTA optimization
- Trust signals
- Schema markup

4. COLLECTION/CATEGORY PAGE AUDIT
- URL structure
- Keyword optimization
- Category page content depth
- Filter & facet indexing issues
- Breadcrumb navigation
- Internal linking
- Missing SEO opportunities

5. PRODUCT PAGE AUDIT
- Product title optimization
- Product description quality
- Image alt text
- Product schema markup
- Review & rating schema
- Duplicate content issues
- Cross-selling opportunities

6. CONTENT & BLOG AUDIT
- Blog presence & quality
- Content gaps analysis
- Topical authority check
- Keyword targeting in blogs
- Internal linking from blogs
- Author E-E-A-T signals
- Missing content opportunities

7. E-E-A-T ANALYSIS
- Expertise signals
- Experience signals
- Authority signals
- Trustworthiness signals
- About page quality
- Team page presence
- Press & media mentions
- Customer reviews presence

8. AEO ANALYSIS
(Answer Engine Optimization)
- FAQ schema presence
- Featured snippet optimization
- Question-based content
- Direct answer content
- Structured data quality
- Voice search optimization

9. GEO ANALYSIS
(Generative Engine Optimization)
- AI search visibility
- ChatGPT citation potential
- Google SGE optimization
- Perplexity visibility
- Content structure for AI
- Brand mention optimization
- Knowledge panel signals

10. OFF-PAGE SEO AUDIT
- Backlink profile quality
- Domain authority estimate
- Brand mention analysis
- Social proof signals
- Marketplace presence
- Partner & affiliate links

11. CONVERSION SEO AUDIT
- CTA placement & quality
- Trust badges presence
- Social proof visibility
- Checkout flow issues
- UX issues affecting SEO
- Funnel optimization
- Cart abandonment signals

12. LOCAL & INTERNATIONAL SEO
- Hreflang implementation
- Multi-currency setup
- International targeting
- Regional content strategy
- Google Business Profile

For EACH section provide:
✅ Strengths
❌ Weaknesses
🚨 Critical Issues
🔧 Actionable Fixes
📊 Priority Level (High/Medium/Low)

Also provide:
- Overall SEO Score (out of 100)
- Quick Wins (fixes that work fast)
- 30-60-90 Day Action Plan
- Competitor gap analysis
- Keyword opportunities
- Content calendar suggestions

Be brutally honest.
Give specific, practical recommendations.
Do not give generic advice.
Think like a senior SEO consultant.

Return valid JSON only with this structure:
{
  "overallSeoScore": number,
  "TechnicalSEO":number,
  "On-PageSEO":number,
  "HomepageSEO":number,
  "ProductPageSEO":number,
  "CollectionSEO":number,
  "ConversionSEO":number,
  "seoAudit": {
    "technicalSeoAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "onPageSeoAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "homepageSeoAnalysis": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "collectionCategoryPageAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "productPageAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "contentBlogAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "eeatAnalysis": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "aeoAnalysis": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "geoAnalysis": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "offPageSeoAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "conversionSeoAudit": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    },
    "localInternationalSeo": {
      "strengths": string[],
      "weaknesses": string[],
      "criticalIssues": string[],
      "actionableFixes": string[],
      "priorityLevel": "High" | "Medium" | "Low"
    }
  },
  "quickWins": string[],
  "actionPlan30_60_90": {
    "day30": string[],
    "day60": string[],
    "day90": string[]
  },
  "competitorGapAnalysis": string[],
  "keywordOpportunities": string[],
  "contentCalendarSuggestions": string[]
}`;

    return prompt;
  }

  async generateStartupSeoAudit(shopName: string) {
    if (!shopName?.trim()) {
      throw new BadRequestException('shopName is required');
    }

    const shop = await this.getShopByName(shopName);

    if (this.isFreshStartupAudit(shop)) {
      const generatedAt = new Date(shop.startupSeoAuditGeneratedAt as Date).getTime();
      return {
        ...shop.startupSeoAudit,
        cached: true,
        cacheAgeHours: Number(((Date.now() - generatedAt) / (1000 * 60 * 60)).toFixed(2)),
      };
    }

    const [products, collections, vendors, productTypes, categories, tags] =
      await Promise.all([
        this.getProducts(shop._id.toString(), { limit: 20 }),
        this.getCollections(shop._id.toString()),
        this.getVendors(shop._id.toString()),
        this.getProductTypes(shop._id.toString()),
        this.getCategories(shop._id.toString()),
        this.getProductTags(shop._id.toString()),
      ]);

    const storeContext = {
      websiteUrl: `https://${shop.shopDomain}`,
      brandName: shop.shopName,
      businessType:
        productTypes.productTypes?.[0] ||
        categories.categories?.[0]?.title ||
        'Ecommerce Store',
      targetMarket: shop.country || 'Global',
      mainProducts:
        products.products?.slice(0, 8).map((item: any) => item.node.title) || [],
      productsCount: products.totalCount,
      collectionsCount: collections.count,
      vendorsCount: vendors.count,
      productTypes: productTypes.productTypes || [],
      tags: tags.tags?.slice(0, 50) || [],
      categories: categories.categories?.slice(0, 20) || [],
      sampleProducts:
        products.products?.slice(0, 10).map((item: any) => ({
          title: item.node.title,
          handle: item.node.handle,
          vendor: item.node.vendor,
          productType: item.node.productType,
          seoTitle: item.node.seo?.title || '',
          seoDescription: item.node.seo?.description || '',
          status: item.node.status,
        })) || [],
      collections: collections.collections?.slice(0, 20) || [],
      vendors: vendors.vendors?.slice(0, 30) || [],
    };

    const competitorPrompt = `
You are an ecommerce market research assistant.
Analyze the following Shopify store snapshot and return valid JSON only.

Return this exact shape:
{
  "brandName": string,
  "websiteUrl": string,
  "businessType": string,
  "targetMarket": string,
  "mainProducts": string[],
  "competitors": [
    {
      "name": string,
      "url": string,
      "whyRelevant": string
    }
  ]
}

Store Snapshot:
${JSON.stringify(storeContext, null, 2)}

Rules:
- Infer the business type from the store data.
- Pick 3 to 6 real competitor stores if possible.
- Prefer ecommerce brands that sell similar products to this store.
- Keep the output practical and specific.
- Return JSON only.`;

    let competitorContext: any;
    let audit: any;

    try {
      const competitorResponse = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a precise ecommerce research analyst. Return JSON only.',
          },
          { role: 'user', content: competitorPrompt },
        ],
        temperature: 0.2,
      });

      const competitorRaw =
        competitorResponse.choices?.[0]?.message?.content || '';
      competitorContext = this.parseJsonResponse(competitorRaw);

      const auditPrompt = this.buildSeoAuditPrompt(
        {
          ...storeContext,
          brandName:
            competitorContext.brandName || storeContext.brandName,
          businessType:
            competitorContext.businessType || storeContext.businessType,
          targetMarket:
            competitorContext.targetMarket || storeContext.targetMarket,
          mainProducts:
            competitorContext.mainProducts?.length
              ? competitorContext.mainProducts
              : storeContext.mainProducts,
        },
        competitorContext,
      );

      const auditResponse = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a senior SEO consultant. Return valid JSON only.',
          },
          { role: 'user', content: auditPrompt },
        ],
        temperature: 0.35,
      });

      const auditRaw = auditResponse.choices?.[0]?.message?.content || '';
      audit = this.parseJsonResponse(auditRaw);
    } catch (error: any) {
      if (error?.status === 401) {
        throw new BadRequestException(
          'Groq API authentication failed. Please check GROQ_API_KEY and make sure it is a valid active Groq key.',
        );
      }

      throw error;
    }

    const result = {
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        shopDomain: shop.shopDomain,
        websiteUrl: `https://${shop.shopDomain}`,
        country: shop.country,
        owner:shop.owner,
        email:shop.email,
        currency: shop.currency,
        plan: shop.plan,
      },
      storeContext,
      competitorResearch: competitorContext,
      seoAudit: audit,
      cached: false,
    };

    await this.shopModel.findByIdAndUpdate(shop._id, {
      $set: {
        startupSeoAudit: result,
        startupSeoAuditGeneratedAt: new Date(),
      },
    });

    return result;
  }
}
