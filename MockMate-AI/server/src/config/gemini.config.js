import { GoogleGenAI } from '@google/genai';

const MODEL_NAME = 'gemini-2.5-flash';

let aiClient = null;

const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  return aiClient;
};

export const generateContent = async (prompt) => {
  const client = getClient();

  if (!client) {
    throw new Error('Gemini API key is missing');
  }

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  return response.text;
};

export { MODEL_NAME };
