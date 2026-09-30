import * as interviewService from '../services/interview.service.js';
import { transcribeAudio } from '../services/assemblyai.service.js';
import { streamAudio } from '../services/murf.service.js';

export const startInterview = async (req, res, next) => {
  try {
    const { role, resumeText, totalQuestions, difficulty } = req.body;

    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: 'Please select a role for the interview.' });
    }

    if (!resumeText) {
      return res
        .status(400)
        .json({ success: false, message: 'Please upload your resume first.' });
    }

    const data = await interviewService.startInterview({
      userId: req.user._id,
      role,
      difficulty,
      resumeText,
      totalQuestions,
    });

    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const submitTextAnswer = async (req, res, next) => {
  try {
    const { answer } = req.body;
    const data = await interviewService.submitAnswer(req.params.id, req.user._id, answer);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const submitVoiceAnswer = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'Please upload an audio response.' });
    }

    const transcript = await transcribeAudio(req.file.buffer, req.file.originalname);
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No speech detected. Please record at least 3 seconds and speak clearly.',
      });
    }
    const data = await interviewService.submitAnswer(req.params.id, req.user._id, transcript);

    return res.json({
      success: true,
      data: {
        transcript,
        ...data,
      },
    });
  } catch (error) {
    console.error('Voice answer submission failed:', error.message);
    next(error);
  }
};

export const transcribeOnly = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'Please upload an audio file.' });
    }

    const transcript = await transcribeAudio(req.file.buffer, req.file.originalname);
    return res.json({ success: true, data: { transcript } });
  } catch (error) {
    console.error('Audio transcription failed:', error.message);
    next(error);
  }
};

export const submitCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const data = await interviewService.submitCode(req.params.id, req.user._id, code, language);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const endInterview = async (req, res, next) => {
  try {
    const data = await interviewService.endInterview(req.params.id, req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getInterview = async (req, res, next) => {
  try {
    const data = await interviewService.getInterviewById(req.params.id, req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const speakText = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required.' });
    }

    await streamAudio(text, res);
  } catch (error) {
    next(error);
  }
};
