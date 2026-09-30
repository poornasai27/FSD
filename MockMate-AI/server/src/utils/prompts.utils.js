export const parseGeminiJSON = (text) => {
  try {
    let cleanText = text.trim();

    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '');
      cleanText = cleanText.replace(/\n?```\s*$/, '');
    }

    return JSON.parse(cleanText.trim());
  } catch (error) {
    const parseError = new Error(`Failed to parse AI JSON response: ${error.message}`);
    parseError.statusCode = 500;
    throw parseError;
  }
};
