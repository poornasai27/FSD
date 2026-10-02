import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Resume from '../models/Resume.model.js';

const KNOWN_SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Vue',
  'Angular',
  'Node.js',
  'Express',
  'Python',
  'Django',
  'Flask',
  'FastAPI',
  'Java',
  'Spring Boot',
  'C++',
  'C#',
  '.NET',
  'Go',
  'Rust',
  'PHP',
  'Laravel',
  'Ruby',
  'Rails',
  'HTML',
  'CSS',
  'Tailwind',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'GraphQL',
  'REST API',
  'AWS',
  'Azure',
  'GCP',
  'Docker',
  'Kubernetes',
  'CI/CD',
  'Git',
  'Linux',
  'Microservices',
  'System Design',
  'Data Structures',
  'Algorithms',
  'Machine Learning',
  'TensorFlow',
  'PyTorch',
  'Data Analysis',
];

export const extractSkillsFromText = (text = '') => {
  if (!text) return [];
  const lowerText = text.toLowerCase();
  const matched = KNOWN_SKILLS.filter((skill) => {
    const pattern = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return pattern.test(lowerText);
  });
  return matched.length > 0
    ? matched
    : ['Software Engineering', 'Problem Solving', 'Technical Communication'];
};

export const parseResumePDF = async (pdfBuffer) => {
  try {
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
  } catch (error) {
    console.error('PDF parsing fallback:', error.message);
    return pdfBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
  }
};

export const parseResume = async (buffer, fileName = '') => {
  const ext = fileName.toLowerCase().split('.').pop();

  if (ext === 'pdf') {
    return parseResumePDF(buffer);
  }

  if (ext === 'docx') {
    const rawString = buffer.toString('utf-8');
    const xmlTextMatches = rawString.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (xmlTextMatches && xmlTextMatches.length > 0) {
      const extracted = xmlTextMatches
        .map((m) => m.replace(/<[^>]+>/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (extracted.length > 20) return extracted;
    }
  }

  const text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  return text || 'Resume content uploaded.';
};

export const saveResume = async (userId, fileName, extractedText) =>
  Resume.findOneAndUpdate(
    { userId },
    { userId, fileName, extractedText },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

export const getResumeByUserId = async (userId) => Resume.findOne({ userId });
