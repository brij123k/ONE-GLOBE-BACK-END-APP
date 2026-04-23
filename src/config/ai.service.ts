import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;
  private readonly detailOptimizationSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      metaTitle: { type: 'string' },
      metaDescription: { type: 'string' },
      handle: { type: 'string' },
      imageAlt: { type: 'string' },
      imageName: { type: 'string' },
    },
    required: [
      'title',
      'description',
      'metaTitle',
      'metaDescription',
      'handle',
      'imageAlt',
      'imageName',
    ],
  };

  constructor() {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    this.ai = new GoogleGenAI({ apiKey: key });
  }

  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1500,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries === 0) throw error;

      if (error?.status === 503) {
        console.log(`⚠️ Gemini busy... retrying (${retries})`);
        await new Promise((res) => setTimeout(res, delay));
        return this.retryRequest(fn, retries - 1, delay * 2); // exponential backoff
      }

      throw error;
    }
  }

  private async generateContent(
    system: string,
    prompt: string,
  ): Promise<string> {
    const response = await this.retryRequest(() =>
      this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${system}\n\n${prompt}`,
        config: {
          temperature: 0.6,
          maxOutputTokens: 800,
        },
      }),
    );

    return response.text || '';
  }

  async generateTitle(prompt: string): Promise<string> {
    const title = await this.generateContent(
      'You are an expert Shopify SEO title optimizer.',
      prompt,
    );

    return title.replace(/["\n]/g, '').trim();
  }

  async generateTitleFromImage(
    prompt: string,
    imageUrl: string,
  ): Promise<string> {
    const title = await this.generateImageContent(
      'You are an expert Shopify SEO title optimizer. Read the product image carefully and create one SEO-friendly Shopify product title.',
      prompt,
      imageUrl,
      0.4,
      200,
    );
    console.log(title)
    return title.trim();
  }

  async generateDescription(prompt: string): Promise<string> {
    const description = await this.generateContent(
      'You are an expert Shopify SEO product description writer.',
      prompt,
    );

    return description.trim();
  }

  async generateDescriptionFromImage(
    prompt: string,
    imageUrl: string,
  ): Promise<string> {
    const description = await this.generateImageContent(
      'You are an expert Shopify SEO product description writer. Read the product image carefully and create a detailed, SEO-friendly Shopify product description.',
      prompt,
      imageUrl,
      0.6,
      2000,
    );

    return description.trim();
  }

  async generateMetaTitle(prompt: string): Promise<string> {
    const title = await this.generateContent(
      'You are an expert Shopify SEO meta title optimizer. Generate a concise, high-CTR meta title under 60 characters.',
      prompt,
    );

    return title.trim();
  }

  async generateMetaTitleFromImage(
    prompt: string,
    imageUrl: string,
  ): Promise<string> {
    const title = await this.generateImageContent(
      'You are an expert Shopify SEO meta title optimizer. Read the product image carefully and create a concise, SEO-friendly Shopify meta title.',
      prompt,
      imageUrl,
      0.6,
      200,
    );

    return title.trim();
  }

  async generateMetaDescription(prompt: string): Promise<string> {
    const description = await this.generateContent(
      'You are an expert Shopify SEO meta description optimizer. Generate a concise, high-CTR meta Description',
      prompt,
    );

    return description.trim();
  }

  async generateMetaDescriptionFromImage(
    prompt: string,
    imageUrl: string,
  ): Promise<string> {
    const description = await this.generateImageContent(
      'You are an expert Shopify SEO meta description optimizer. Read the product image carefully and create a concise, SEO-friendly Shopify meta description.',
      prompt,
      imageUrl,
      0.6,
      300,
    );

    return description.trim();
  }

  async generateMetaHandle(prompt: string): Promise<string> {
    const handle = await this.generateContent(
      'Generate SEO-friendly Shopify URL handle (slug). Use hyphens, lowercase, no spaces.',
      prompt,
    );

    return handle.trim();
  }

  async generateImageAlt(prompt: string): Promise<string> {
    const alt = await this.generateContent(
      'You generate SEO-friendly ALT text for Shopify images.',
      prompt,
    );

    return alt.replace(/["\n]/g, '').trim();
  }

  async generateImageName(prompt: string): Promise<string> {
    const name = await this.generateContent(
      'You generate SEO-friendly Image Name text for Shopify images.',
      prompt,
    );

    return name.replace(/["\n]/g, '').trim();
  }

  async generateDetailOptimization(
    prompt: string,
    imageUrl?: string | null,
  ): Promise<string> {
    if (imageUrl) {
      const image = await this.fetchImageForGemini(imageUrl);

      const response = await this.retryRequest(() =>
        this.ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are an expert Shopify SEO optimizer. Analyze the product image first, then optimize all requested Shopify product detail fields. Return valid JSON only.\n\n${prompt}`,
                },
                {
                  inlineData: {
                    mimeType: image.mimeType,
                    data: image.data,
                  },
                },
              ],
            },
          ],
          config: {
            temperature: 0.4,
            maxOutputTokens: 2400,
            responseMimeType: 'application/json',
            responseJsonSchema: this.detailOptimizationSchema,
          },
        }),
      );

      return response.text || '';
    }

    const response = await this.retryRequest(() =>
      this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert Shopify SEO optimizer. Optimize all requested Shopify product detail fields. Return valid JSON only.\n\n${prompt}`,
        config: {
          temperature: 0.4,
          maxOutputTokens: 2400,
          responseMimeType: 'application/json',
          responseJsonSchema: this.detailOptimizationSchema,
        },
      }),
    );

    return response.text || '';
  }

  async generateProductType(prompt: string): Promise<string> {
    const type = await this.generateContent(
      'You are an expert Shopify SEO Product Type optimizer.',
      prompt,
    );

    return type.replace(/["\n]/g, '').trim();
  }

  async generateCategory(prompt: string): Promise<string> {
    const category = await this.generateContent(
      'You are an expert Shopify SEO optimizer.',
      prompt,
    );

    return category.replace(/["\n]/g, '').trim();
  }

  async generateImageAnalysis(
    prompt: string,
    imageUrl: string,
  ): Promise<string> {
    const image = await this.fetchImageForGemini(imageUrl);

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: image.mimeType,
                data: image.data,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    });

    return response.text || '';
  }

  private async generateImageContent(
    system: string,
    prompt: string,
    imageUrl: string,
    temperature: number,
    maxOutputTokens: number,
  ): Promise<string> {
    const image = await this.fetchImageForGemini(imageUrl);

    const response = await this.retryRequest(() =>
      this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${system}\n\n${prompt}` },
              {
                inlineData: {
                  mimeType: image.mimeType,
                  data: image.data,
                },
              },
            ],
          },
        ],
        config: {
          temperature,
          maxOutputTokens,
        },
      }),
    );

    return response.text || '';
  }

  private async fetchImageForGemini(
    url: string,
  ): Promise<{ data: string; mimeType: string }> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch product image: ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    const mimeType =
      res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';

    return {
      data: Buffer.from(buffer).toString('base64'),
      mimeType,
    };
  }
}
