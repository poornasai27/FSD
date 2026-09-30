import * as resumeService from '../services/resume.service.js';

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No file uploaded. Please select a PDF.' });
    }

    const extractedText = await resumeService.parseResumePDF(req.file.buffer);
    const resume = await resumeService.saveResume(
      req.user._id,
      req.file.originalname,
      extractedText
    );

    return res.status(201).json({
      success: true,
      data: {
        id: resume._id,
        fileName: resume.fileName,
        text: resume.extractedText,
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

    return res.json({
      success: true,
      data: {
        id: resume._id,
        fileName: resume.fileName,
        text: resume.extractedText,
        preview: resume.extractedText.slice(0, 500),
      },
    });
  } catch (error) {
    next(error);
  }
};
