import { Injectable } from '@nestjs/common';
import { groqClient } from './groq.config';

@Injectable()
export class AiService {

  async generateTitle(prompt: string): Promise<string> {
    const response = await groqClient.chat.completions.create({
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
}
