import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ASSEMBLY_BASE_URL = 'https://api.assemblyai.com/v2';
const MAX_POLL_TIMEOUT_MS = 60000;

export const transcribeAudio = async (audioBuffer, originalName = 'answer.webm') => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;

  if (!apiKey || !apiKey.trim() || apiKey === 'your_assemblyai_api_key_here') {
    console.error(
      '[AssemblyAI Error] ASSEMBLYAI_API_KEY environment variable is missing or unconfigured on the server.'
    );
    const error = new Error('Unable to process your voice answer. Please try again.');
    error.statusCode = 500;
    throw error;
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    const error = new Error('Recorded audio file is empty. Please try recording again.');
    error.statusCode = 400;
    throw error;
  }

  const extension = path.extname(originalName) || '.webm';
  const tempPath = path.join(os.tmpdir(), `interviewmate-${Date.now()}${extension}`);

  try {
    await fs.promises.writeFile(tempPath, audioBuffer);

    const uploadResponse = await axios.post(
      `${ASSEMBLY_BASE_URL}/upload`,
      fs.createReadStream(tempPath),
      {
        headers: {
          Authorization: apiKey.trim(),
          'Content-Type': 'application/octet-stream',
        },
        maxBodyLength: Infinity,
        timeout: 30000,
      }
    );

    const uploadUrl = uploadResponse.data?.upload_url;
    if (!uploadUrl) {
      throw new Error('AssemblyAI upload failed to return a valid audio URL.');
    }

    const transcriptCreateResponse = await axios.post(
      `${ASSEMBLY_BASE_URL}/transcript`,
      {
        audio_url: uploadUrl,
        speech_models: ['universal-2'],
      },
      {
        headers: {
          Authorization: apiKey.trim(),
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const transcriptId = transcriptCreateResponse.data?.id;
    if (!transcriptId) {
      throw new Error('AssemblyAI did not return a valid transcript ID.');
    }

    const startTime = Date.now();
    while (Date.now() - startTime < MAX_POLL_TIMEOUT_MS) {
      const pollResponse = await axios.get(`${ASSEMBLY_BASE_URL}/transcript/${transcriptId}`, {
        headers: {
          Authorization: apiKey.trim(),
        },
        timeout: 15000,
      });

      const { status, text, error: pollError } = pollResponse.data || {};

      if (status === 'completed') {
        return text || '';
      }

      if (status === 'error') {
        console.error('[AssemblyAI Transcription Error]', pollError);
        const err = new Error('Unable to process your voice answer. Please try again.');
        err.statusCode = 500;
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error('AssemblyAI transcription timed out.');
  } catch (error) {
    console.error('[AssemblyAI Service Failure]:', error.response?.data || error.message);
    if (error.statusCode) throw error;
    const userError = new Error('Unable to process your voice answer. Please try again.');
    userError.statusCode = 500;
    throw userError;
  } finally {
    if (fs.existsSync(tempPath)) {
      await fs.promises.unlink(tempPath).catch(() => {});
    }
  }
};
