import { Injectable } from '@nestjs/common';
// import { groqClient } from './groq.config';
import Groq from 'groq-sdk';
@Injectable()
export class AiService {
 private groq: Groq;

  constructor() {
    const key = process.env.GROQ_API_KEY;

    if (!key) {
      throw new Error('GROQ_API_KEY is missing');
    }

    this.groq = new Groq({ apiKey: key });
  }
  async generateTitle(prompt: string): Promise<string> {
    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Shopify SEO title optimizer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    let title = response.choices[0].message.content ?? '';

    // 🧹 Clean output
    title = title
      .replace(/["\n]/g, '')
      .trim();

    return title;
  }

   async generateDescription(prompt: string): Promise<string> {
    console.log('Groq Key Loaded:', !!process.env.GROQ_API_KEY);
    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Shopify SEO product description writer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });
    console.log(response)

    let description = response.choices[0].message.content ?? '';

    return description.trim();
  }


  async generateMetaTitle(prompt: string): Promise<string> {
  const response = await this.groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert Shopify SEO meta title optimizer. Generate a concise, high-CTR meta title under 60 characters.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.6,
    max_tokens: 120,
  });

  let title = response.choices[0].message.content ?? '';

  // 🧹 Clean output
  title = title
    .replace(/["\n]/g, '')
    .trim();

  return title;
}

async generateMetaDescription(prompt: string): Promise<string> {
  const response = await this.groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert Shopify SEO meta description optimizer. Generate a concise, high-CTR meta Description',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.6,
    max_tokens: 120,
  });

  let description = response.choices[0].message.content ?? '';

  // 🧹 Clean output
  description = description.trim();

  return description;
}

}
