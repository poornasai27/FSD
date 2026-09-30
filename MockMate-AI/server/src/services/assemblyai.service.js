import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ASSEMBLY_BASE_URL = 'https://api.assemblyai.com/v2';

export const transcribeAudio = async (audioBuffer, originalName = 'answer.webm') => {
  if (!process.env.ASSEMBLYAI_API_KEY) {
    throw new Error('AssemblyAI API key is missing');
  }

  const extension = path.extname(originalName) || '.webm';
  const tempPath = path.join(os.tmpdir(), `ai-mock-interview-${Date.now()}${extension}`);

  try {
    await fs.promises.writeFile(tempPath, audioBuffer);

    const uploadResponse = await axios.post(
      `${ASSEMBLY_BASE_URL}/upload`,
      fs.createReadStream(tempPath),
      {
        headers: {
          Authorization: process.env.ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/octet-stream',
        },
        maxBodyLength: Infinity,
      }
    );

    const transcriptCreateResponse = await axios.post(
      `${ASSEMBLY_BASE_URL}/transcript`,
      {
        audio_url: uploadResponse.data.upload_url,
        speech_models: ['universal-2'],
      },
      {
        headers: {
          Authorization: process.env.ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const transcriptId = transcriptCreateResponse.data.id;
    if (!transcriptId) {
      throw new Error('AssemblyAI did not return a transcript id.');
    }

    while (true) {
      const pollResponse = await axios.get(`${ASSEMBLY_BASE_URL}/transcript/${transcriptId}`, {
        headers: {
          Authorization: process.env.ASSEMBLYAI_API_KEY,
        },
      });

      if (pollResponse.data.status === 'completed') {
        return pollResponse.data.text || '';
      }

      if (pollResponse.data.status === 'error') {
        throw new Error(pollResponse.data.error || 'AssemblyAI transcription failed.');
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  } catch (error) {
    const apiMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'AssemblyAI transcription failed.';
    throw new Error(apiMessage);
  } finally {
    if (fs.existsSync(tempPath)) {
      await fs.promises.unlink(tempPath).catch(() => {});
    }
  }
};
