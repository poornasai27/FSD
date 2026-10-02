import Interview from '../models/Interview.model.js';
import { askGemini } from './gemini.service.js';
import { generateAudio } from './murf.service.js';
import { parseGeminiJSON } from '../utils/prompts.utils.js';
import {
  GENERATE_QUESTIONS_PROMPT,
  INTERVIEW_GREETING_PROMPT,
  FOLLOW_UP_PROMPT,
  FEEDBACK_PROMPT,
  EVALUATE_CODE_PROMPT,
  buildConversationHistory,
} from '../constants/prompts.js';
import {
  buildFallbackCodeEvaluation,
  buildFallbackFeedback,
  buildFallbackGreeting,
  buildFallbackQuestions,
  buildFallbackTransition,
  sanitizeInterviewQuestionText,
} from '../utils/fallback.utils.js';

const ensureInterview = async (interviewId, userId) => {
  const interview = await Interview.findOne({ _id: interviewId, userId });
  if (!interview) {
    const error = new Error('Interview not found');
    error.statusCode = 404;
    throw error;
  }
  return interview;
};

const safeGenerateAudio = async (text) => {
  try {
    return await generateAudio(text);
  } catch (_error) {
    return null;
  }
};

const getQuestionCountByDifficulty = (difficulty) => {
  const norm = (difficulty || '').toLowerCase();
  if (norm === 'easy') return 5;
  if (norm === 'hard') return 10;
  return 7; // medium
};

const createQuestions = async (role, resumeText, totalQuestions, difficulty) => {
  try {
    const response = await askGemini(
      GENERATE_QUESTIONS_PROMPT(role, resumeText, totalQuestions, difficulty)
    );
    const parsed = parseGeminiJSON(response);
    return parsed.questions;
  } catch (_error) {
    return buildFallbackQuestions(role, resumeText, totalQuestions);
  }
};

const normalizeQuestions = (questions = [], role, resumeText, totalQuestions) => {
  const backup = buildFallbackQuestions(role, resumeText, totalQuestions);

  return questions.map((question, index) => {
    const safeText = sanitizeInterviewQuestionText(question?.text || '');
    const fallbackText = backup[index]?.text || `Can you explain your technical approach to a key problem in your resume experience?`;

    return {
      text: safeText || fallbackText,
      type: question?.type || backup[index]?.type || 'technical',
      expectedTopics: Array.isArray(question?.expectedTopics) && question.expectedTopics.length > 0
        ? question.expectedTopics
        : backup[index]?.expectedTopics || ['experience', 'reasoning'],
    };
  });
};

const createGreeting = async (role) => {
  try {
    return await askGemini(INTERVIEW_GREETING_PROMPT(role));
  } catch (_error) {
    return buildFallbackGreeting(role);
  }
};

const createTransition = async (role, messages, nextQuestion) => {
  try {
    return await askGemini(
      FOLLOW_UP_PROMPT(role, buildConversationHistory(messages), nextQuestion)
    );
  } catch (_error) {
    return buildFallbackTransition(nextQuestion);
  }
};

const createCodeEvaluation = async (role, question, code, language) => {
  try {
    const response = await askGemini(EVALUATE_CODE_PROMPT(role, question, code, language));
    return parseGeminiJSON(response);
  } catch (_error) {
    return buildFallbackCodeEvaluation(code);
  }
};

const buildFeedback = async (interview) => {
  const candidateMessages = interview.messages.filter((message) => message.sender === 'candidate');
  const meaningfulCandidateMessages = candidateMessages.filter((message) => {
    const normalized = message.text.trim().toLowerCase();
    return (
      normalized.length > 0 &&
      normalized !== 'submitted coding solution and requested the next interview question.'
    );
  });

  if (meaningfulCandidateMessages.length === 0 && interview.codeSubmissions.length === 0) {
    return buildFallbackFeedback(interview.messages, interview.codeSubmissions);
  }

  const transcript = interview.messages
    .map((message) => `${message.sender}: ${message.text}`)
    .join('\n');
  const codeSummary = interview.codeSubmissions
    .map(
      (item) =>
        `Question ${item.questionNumber}\nCode:\n${item.code}\nEvaluation:${JSON.stringify(
          item.evaluation
        )}`
    )
    .join('\n\n');

  try {
    const response = await askGemini(FEEDBACK_PROMPT(interview.role, transcript, codeSummary));
    return parseGeminiJSON(response);
  } catch (_error) {
    return buildFallbackFeedback(interview.messages, interview.codeSubmissions);
  }
};

export const startInterview = async ({
  userId,
  role = 'Candidate',
  difficulty = 'medium',
  resumeText,
  totalQuestions,
}) => {
  const targetQuestionsCount = getQuestionCountByDifficulty(difficulty);
  const effectiveRole = role && role !== 'Select your target' ? role : 'Technical Candidate';

  const generatedQuestions = await createQuestions(effectiveRole, resumeText, targetQuestionsCount, difficulty);
  const safeGeneratedQuestions = normalizeQuestions(
    generatedQuestions,
    effectiveRole,
    resumeText,
    targetQuestionsCount
  );
  const questions = [
    {
      text: 'Tell me about yourself and your technical background.',
      type: 'behavioral',
      expectedTopics: ['background', 'experience', 'goals'],
    },
    ...safeGeneratedQuestions,
  ].slice(0, targetQuestionsCount);

  const greeting = (await createGreeting(role))?.trim() || buildFallbackGreeting(role);
  const introAudio = await safeGenerateAudio(greeting);
  const firstQuestionText = questions[0]?.text?.trim() || 'Tell me about yourself.';

  const interview = await Interview.create({
    userId,
    role,
    difficulty,
    totalQuestions,
    currentQuestion: 1,
    questions,
    messages: [
      {
        sender: 'ai',
        text: greeting,
        questionNumber: 1,
      },
      {
        sender: 'ai',
        text: firstQuestionText,
        questionNumber: 1,
      },
    ],
  });

  return {
    interviewId: interview._id,
    greeting,
    audioBase64: introAudio,
    currentQuestion: 1,
    totalQuestions: interview.totalQuestions,
    questions: interview.questions,
    question: {
      ...interview.questions[0]?.toObject?.(),
      text: firstQuestionText,
    },
    status: interview.status,
    role: interview.role,
    difficulty: interview.difficulty,
  };
};

export const submitAnswer = async (interviewId, userId, answerText) => {
  const interview = await ensureInterview(interviewId, userId);
  const cleanedAnswer = typeof answerText === 'string' ? answerText.trim() : '';

  if (!cleanedAnswer) {
    const error = new Error('No valid answer was captured. Please record again or type your answer.');
    error.statusCode = 400;
    throw error;
  }

  if (interview.status === 'completed') {
    return {
      completed: true,
      interviewId: interview._id,
      feedback: interview.feedback,
    };
  }

  const currentIndex = interview.currentQuestion - 1;
  interview.messages.push({
    sender: 'candidate',
    text: cleanedAnswer,
    questionNumber: interview.currentQuestion,
  });

  const isLastQuestion = interview.currentQuestion >= interview.totalQuestions;

  if (isLastQuestion) {
    interview.status = 'completed';
    const feedback = await buildFeedback(interview);
    interview.feedback = feedback;
    interview.overallScore = feedback.overallScore ?? null;
    await interview.save();

    return {
      completed: true,
      interviewId: interview._id,
      feedback,
    };
  }

  const nextQuestionNumber = interview.currentQuestion + 1;
  const nextQuestion = interview.questions[currentIndex + 1];
  const transitionText = await createTransition(
    interview.role,
    interview.messages,
    nextQuestion.text
  );
  const audioBase64 = await safeGenerateAudio(transitionText);

  interview.currentQuestion = nextQuestionNumber;
  interview.messages.push({
    sender: 'ai',
    text: transitionText,
    questionNumber: nextQuestionNumber,
  });

  await interview.save();

  return {
    completed: false,
    interviewId: interview._id,
    currentQuestion: nextQuestionNumber,
    question: nextQuestion,
    aiMessage: transitionText,
    audioBase64,
  };
};

export const submitCode = async (interviewId, userId, code, language = 'javascript') => {
  const interview = await ensureInterview(interviewId, userId);
  const currentIndex = interview.currentQuestion - 1;
  const question = interview.questions[currentIndex];
  const evaluation = await createCodeEvaluation(
    interview.role,
    question?.text || 'Coding challenge',
    code,
    language
  );

  interview.codeSubmissions.push({
    questionNumber: interview.currentQuestion,
    language,
    code,
    evaluation,
  });
  await interview.save();

  return { evaluation };
};

export const endInterview = async (interviewId, userId) => {
  const interview = await ensureInterview(interviewId, userId);

  if (interview.status === 'completed' && interview.feedback) {
    return {
      interviewId: interview._id,
      feedback: interview.feedback,
      overallScore: interview.overallScore,
    };
  }

  interview.status = 'completed';
  const feedback = await buildFeedback(interview);
  interview.feedback = feedback;
  interview.overallScore = feedback.overallScore ?? null;
  await interview.save();

  return {
    interviewId: interview._id,
    feedback,
    overallScore: interview.overallScore,
  };
};

export const getInterviewById = async (interviewId, userId) => ensureInterview(interviewId, userId);
