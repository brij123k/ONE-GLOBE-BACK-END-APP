import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly ai: GoogleGenAI;

  constructor() {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    this.ai = new GoogleGenAI({ apiKey: key });
  }

  private async generateContent(
    system: string,
    prompt: string,
  ): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${system}\n\n${prompt}`,
      config: {
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    });

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

    return title.replace(/["\n]/g, '').trim();
  }

  async generateDescription(prompt: string): Promise<string> {
    const description = await this.generateContent(
      'You are an expert Shopify SEO product description writer.',
      prompt,
    );

    return description.trim();
  }

  async generateMetaTitle(prompt: string): Promise<string> {
    const title = await this.generateContent(
      'You are an expert Shopify SEO meta title optimizer. Generate a concise, high-CTR meta title under 60 characters.',
      prompt,
    );

    return title.replace(/["\n]/g, '').trim();
  }

  async generateMetaDescription(prompt: string): Promise<string> {
    const description = await this.generateContent(
      'You are an expert Shopify SEO meta description optimizer. Generate a concise, high-CTR meta Description',
      prompt,
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

    const response = await this.ai.models.generateContent({
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
    });

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
