import Groq from 'groq-sdk';
import 'dotenv/config';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const run = async () => {
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Say OK' }],
  });
  console.log(res.choices[0].message.content);
};

run();
