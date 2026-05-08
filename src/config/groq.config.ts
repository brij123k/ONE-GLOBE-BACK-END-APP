import Groq from 'groq-sdk';
import 'dotenv/config';

const apiKey = process.env.GROQ_API_KEY?.trim();

if (!apiKey) {
  throw new Error('GROQ_API_KEY is missing');
}

export const groqClient = new Groq({
  apiKey,
});
