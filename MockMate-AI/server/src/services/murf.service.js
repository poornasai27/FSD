import axios from 'axios';

const MURF_BASE_URL = 'https://global.api.murf.ai/v1/speech/stream';
const MURF_VOICE_ID = 'en-US-natalie';
const MURF_LOCALE = 'en-US';

const buildPayload = (text) => ({
  text: `[pause 1s] ${text}`,
  voiceId: MURF_VOICE_ID,
  model: 'FALCON',
  multiNativeLocale: MURF_LOCALE,
  format: 'MP3',
});

export const generateAudio = async (text) => {
  if (!process.env.MURF_API_KEY) {
    return null;
  }

  const response = await axios.post(MURF_BASE_URL, buildPayload(text), {
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'api-key': process.env.MURF_API_KEY,
    },
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data).toString('base64');
};

export const streamAudio = async (text, res) => {
  if (!process.env.MURF_API_KEY) {
    res.status(400).json({ success: false, message: 'Murf API key is not configured.' });
    return;
  }

  try {
    const response = await axios.post(MURF_BASE_URL, buildPayload(text), {
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'api-key': process.env.MURF_API_KEY,
      },
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (_error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream speech audio.' });
    } else {
      res.end();
    }
  }
};
