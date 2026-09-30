import { generateContent } from '../config/gemini.config.js';

export const askGemini = async (prompt) => {
  const response = await generateContent(prompt);

  if (!response) {
    throw new Error('Gemini returned an empty response');
  }

  return response;
};
