import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Resume from '../models/Resume.model.js';

export const parseResumePDF = async (pdfBuffer) => {
  const uint8Array = new Uint8Array(
    pdfBuffer.buffer,
    pdfBuffer.byteOffset,
    pdfBuffer.byteLength
  );

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const pages = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    pages.push(pageText);
  }

  return pages.join('\n').trim();
};

export const saveResume = async (userId, fileName, extractedText) =>
  Resume.findOneAndUpdate(
    { userId },
    { userId, fileName, extractedText },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

export const getResumeByUserId = async (userId) => Resume.findOne({ userId });
