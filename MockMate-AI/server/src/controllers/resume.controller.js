import * as resumeService from '../services/resume.service.js';

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded. Please select a PDF, DOC, DOCX, or TXT file.' });
    }

    const extractedText = await resumeService.parseResume(req.file.buffer, req.file.originalname);
    const resume = await resumeService.saveResume(
      req.user._id,
      req.file.originalname,
      extractedText
    );
    const skills = resumeService.extractSkillsFromText(extractedText);

    return res.status(201).json({
      success: true,
      data: {
        id: resume._id,
        fileName: resume.fileName,
        text: resume.extractedText,
        skills,
        preview: resume.extractedText.slice(0, 500),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getResume = async (req, res, next) => {
  try {
    const resume = await resumeService.getResumeByUserId(req.user._id);

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const skills = resumeService.extractSkillsFromText(resume.extractedText);

    return res.json({
      success: true,
      data: {
        id: resume._id,
        fileName: resume.fileName,
        text: resume.extractedText,
        skills,
        preview: resume.extractedText.slice(0, 500),
      },
    });
  } catch (error) {
    next(error);
  }
};
