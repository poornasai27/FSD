const splitResumeLines = (resumeText = '') =>
  resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const MAX_QUESTION_CHARS = 240;

const normalizeWhitespace = (text = '') => text.replace(/\s+/g, ' ').trim();

const looksLikePII = (text = '') =>
  /@|https?:\/\/|www\.|\+?\d[\d\s-]{7,}/i.test(text);

const clampQuestionText = (text = '') => {
  const clean = normalizeWhitespace(text);
  if (clean.length <= MAX_QUESTION_CHARS) {
    return clean;
  }
  return `${clean.slice(0, MAX_QUESTION_CHARS - 1).trim()}?`;
};

const pickResumeTopic = (resumeText = '') => {
  const normalized = resumeText.toLowerCase();
  const topics = [
    'react',
    'next.js',
    'typescript',
    'javascript',
    'node',
    'express',
    'mongodb',
    'sql',
    'aws',
    'docker',
    'rest api',
    'testing',
  ];
  return topics.find((topic) => normalized.includes(topic)) || null;
};

export const sanitizeInterviewQuestionText = (text = '') => {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return '';
  }

  const wordCount = normalized.split(' ').length;
  if (looksLikePII(normalized) || wordCount > 45 || normalized.length > 500) {
    return '';
  }

  return clampQuestionText(normalized);
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'because',
  'but',
  'by',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'was',
  'we',
  'with',
  'you',
  'your',
]);

const GENERIC_PATTERNS = [
  'i do not know',
  "i don't know",
  'not sure',
  'maybe',
  'probably',
  'no idea',
  'etc',
  'something like that',
  'and so on',
  'whatever',
];

const tokenize = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const average = (values = []) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const calculateOverlapRatio = (sourceTokens = [], targetTokens = []) => {
  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return 0;
  }

  const targetSet = new Set(targetTokens);
  const overlapCount = sourceTokens.filter((token) => targetSet.has(token)).length;
  return overlapCount / Math.max(1, Math.min(sourceTokens.length, targetTokens.length));
};

const analyzeAnswerQuality = (questionText = '', answerText = '', expectedTopics = []) => {
  const normalizedAnswer = answerText.trim().toLowerCase();
  const answerTokens = tokenize(answerText);
  const questionTokens = tokenize(questionText);
  const topicTokens = expectedTopics.flatMap((topic) => tokenize(topic));
  const uniqueAnswerTokens = new Set(answerTokens);
  const uniqueRatio =
    answerTokens.length > 0 ? uniqueAnswerTokens.size / answerTokens.length : 0;
  const overlapRatio = Math.max(
    calculateOverlapRatio(answerTokens, questionTokens),
    calculateOverlapRatio(answerTokens, topicTokens)
  );
  const genericPenalty = GENERIC_PATTERNS.some((pattern) => normalizedAnswer.includes(pattern))
    ? 18
    : 0;
  const brevityPenalty =
    answerTokens.length < 8 ? 35 : answerTokens.length < 20 ? 18 : answerTokens.length < 40 ? 8 : 0;
  const repetitionPenalty = uniqueRatio < 0.45 ? 18 : uniqueRatio < 0.6 ? 10 : 0;
  const irrelevancePenalty = overlapRatio < 0.08 ? 24 : overlapRatio < 0.16 ? 12 : 0;
  const substanceBonus =
    answerTokens.length >= 40 && uniqueRatio >= 0.62 && overlapRatio >= 0.16 ? 10 : 0;

  const score = clamp(
    55 + substanceBonus - genericPenalty - brevityPenalty - repetitionPenalty - irrelevancePenalty,
    0,
    78
  );

  return {
    score,
    answerTokensCount: answerTokens.length,
    overlapRatio,
    uniqueRatio,
    looksGeneric: genericPenalty > 0,
  };
};

const evaluateEvidence = (messages = [], codeSubmissions = [], questions = []) => {
  const candidateMessages = messages.filter((message) => message.sender === 'candidate');
  const meaningfulCandidateMessages = candidateMessages.filter((message) => {
    const normalized = message.text.trim().toLowerCase();
    return (
      normalized.length > 0 &&
      normalized !== 'submitted coding solution and requested the next interview question.'
    );
  });

  const answerAnalyses = meaningfulCandidateMessages.map((message) => {
    const matchingQuestion = questions[message.questionNumber - 1];
    return analyzeAnswerQuality(
      matchingQuestion?.text || '',
      message.text,
      matchingQuestion?.expectedTopics || []
    );
  });

  const totalWords = meaningfulCandidateMessages.reduce(
    (sum, message) => sum + message.text.split(/\s+/).filter(Boolean).length,
    0
  );

  return {
    candidateMessages,
    meaningfulCandidateMessages,
    answerAnalyses,
    totalWords,
    averageAnswerScore: average(answerAnalyses.map((item) => item.score)),
    averageOverlap: average(answerAnalyses.map((item) => item.overlapRatio)),
    averageUniqueRatio: average(answerAnalyses.map((item) => item.uniqueRatio)),
    codeSubmissions,
  };
};

export const buildFallbackQuestions = (role, resumeText, totalQuestions) => {
  const roleTopic = pickResumeTopic(resumeText);
  const questions = [];

  const templates = [
    {
      type: 'behavioral',
      text: 'Tell me about a project where you made a meaningful technical impact.',
    },
    {
      type: 'behavioral',
      text: 'Describe a challenge you faced while collaborating with a team and how you handled it.',
    },
    {
      type: 'technical',
      text: roleTopic
        ? `You worked with ${roleTopic}. What key tradeoffs did you evaluate while using it in production?`
        : `What technical principles matter most in a strong ${role} solution, and how have you applied them in practice?`,
    },
    {
      type: 'technical',
      text: `What tools, patterns, or frameworks would you prioritize in a ${role} role and why?`,
    },
    {
      type: 'coding',
      text: `Coding challenge: implement a small ${role} solution that processes input, handles edge cases, and explain your time and space complexity.`,
    },
  ];

  for (let i = 0; i < totalQuestions - 1; i += 1) {
    const item = templates[i % templates.length];
    questions.push({
      text: clampQuestionText(item.text),
      type: item.type,
      expectedTopics: ['experience', 'reasoning'],
    });
  }

  return questions;
};

export const buildFallbackGreeting = (role) =>
  `Hi, I’m Natalie. I’ll be your AI interviewer for this ${role} mock interview. We’ll cover your background, technical thinking, and a coding task. Let’s begin with: tell me about yourself.`;

export const buildFallbackTransition = (nextQuestion) =>
  `Thanks for sharing. Let’s move to the next question: ${nextQuestion}`;

export const buildFallbackCodeEvaluation = (code) => {
  const trimmed = code.trim();
  const lengthScore = trimmed.length === 0 ? 0 : clamp(Math.round(trimmed.length / 14 + 10), 8, 70);
  return {
    score: lengthScore,
    summary: 'Fallback code review generated locally because the AI evaluator was unavailable.',
    strengths: trimmed
      ? ['You provided a concrete implementation to review.']
      : ['You reached the coding section.'],
    improvements: trimmed
      ? ['Correctness could not be verified automatically, so no generous score was assumed.', 'Discuss edge cases, complexity, and validation more explicitly.']
      : ['Provide a runnable solution so the evaluation can be more accurate.', 'Explain your intended approach before submitting.'],
  };
};

export const buildFallbackFeedback = (messages = [], codeSubmissions = [], questions = []) => {
  const evidence = evaluateEvidence(messages, codeSubmissions, questions);
  const meaningfulWords = evidence.totalWords;
  const answeredCount = evidence.meaningfulCandidateMessages.length;

  if (answeredCount === 0 && codeSubmissions.length === 0) {
    return {
      overallScore: 0,
      categories: {
        communication: {
          score: 0,
          summary: 'No answer was submitted, so communication could not be evaluated.',
        },
        technicalKnowledge: {
          score: 0,
          summary: 'No technical response was available to assess.',
        },
        problemSolving: {
          score: 0,
          summary: 'No problem-solving attempt or code submission was provided.',
        },
        confidence: {
          score: 0,
          summary: 'Confidence could not be assessed because the interview was ended before any attempt.',
        },
        roleReadiness: {
          score: 0,
          summary: 'Role readiness cannot be estimated without at least one attempted answer.',
        },
      },
      strengths: ['You successfully launched the interview flow.'],
      improvements: [
        'Attempt at least one verbal, text, or coding response before ending the interview.',
        'Complete more questions to receive meaningful feedback and scoring.',
      ],
      finalAssessment:
        'This interview ended before any answer or code attempt was submitted, so no meaningful performance score can be given.',
    };
  }

  if (answeredCount <= 1 && meaningfulWords < 20 && codeSubmissions.length === 0) {
    return {
      overallScore: 12,
      categories: {
        communication: {
          score: 15,
          summary: 'Too little answer data was provided to assess communication reliably.',
        },
        technicalKnowledge: {
          score: 10,
          summary: 'There was not enough technical content to evaluate knowledge meaningfully.',
        },
        problemSolving: {
          score: 10,
          summary: 'A fuller attempt is needed before problem-solving can be scored fairly.',
        },
        confidence: {
          score: 12,
          summary: 'Confidence could not be judged reliably from a very short or partial attempt.',
        },
        roleReadiness: {
          score: 12,
          summary: 'This score reflects an incomplete interview rather than actual readiness.',
        },
      },
      strengths: ['You started the mock interview and made an initial attempt.'],
      improvements: [
        'Answer more questions in detail to receive a meaningful evaluation.',
        'Use specific examples, reasoning, and outcomes in your responses.',
      ],
      finalAssessment:
        'The interview was ended too early to produce a reliable performance report, so this score is intentionally low and reflects insufficient evidence rather than ability.',
    };
  }

  const codeScore =
    codeSubmissions.length > 0
      ? Math.round(
          average(codeSubmissions.map((item) => item.evaluation?.score || 20))
        )
      : 10;

  const communication = clamp(
    Math.round(evidence.averageAnswerScore * 0.8 + evidence.averageUniqueRatio * 20),
    0,
    72
  );
  const technicalKnowledge = clamp(
    Math.round(evidence.averageAnswerScore * 0.9 + evidence.averageOverlap * 25),
    0,
    75
  );
  const problemSolving = clamp(
    Math.round((evidence.averageAnswerScore * 0.35) + (codeScore * 0.65)),
    0,
    78
  );
  const confidence = clamp(
    Math.round(communication * 0.85 - (evidence.averageOverlap < 0.1 ? 8 : 0)),
    0,
    70
  );
  const roleReadiness = Math.round(
    (communication + technicalKnowledge + problemSolving + confidence) / 4
  );

  const lowEvidence = evidence.averageAnswerScore < 30 || evidence.averageOverlap < 0.1;
  const strengths = [];
  const improvements = [];

  if (answeredCount >= 2) {
    strengths.push('You completed multiple interview responses, which provides enough signal for basic coaching.');
  }
  if (codeSubmissions.length > 0) {
    strengths.push('You attempted the coding portion instead of skipping it.');
  }
  if (strengths.length === 0) {
    strengths.push('You completed enough of the interview to generate a limited fallback assessment.');
  }

  if (lowEvidence) {
    improvements.push('Many responses appear vague, generic, or weakly tied to the actual question.');
  }
  if (technicalKnowledge < 45) {
    improvements.push('Use precise technical explanations and concrete examples instead of broad claims.');
  }
  if (problemSolving < 45) {
    improvements.push('Show clearer step-by-step reasoning and provide a stronger working solution in coding rounds.');
  }
  if (improvements.length < 2) {
    improvements.push('Explain tradeoffs, edge cases, and outcomes more explicitly.');
  }

  return {
    overallScore: roleReadiness,
    categories: {
      communication: {
        score: communication,
        summary: 'Your communication score is estimated from the depth and consistency of your answers.',
      },
      technicalKnowledge: {
        score: technicalKnowledge,
        summary: 'Technical knowledge is inferred from your interview responses and coding discussion.',
      },
      problemSolving: {
        score: problemSolving,
        summary: 'Problem solving reflects the coding section and how clearly you reasoned through solutions.',
      },
      confidence: {
        score: confidence,
        summary: 'Confidence is estimated from answer consistency and willingness to elaborate.',
      },
      roleReadiness: {
        score: roleReadiness,
        summary: 'This summarizes your current readiness based on the available interview data.',
      },
    },
    strengths,
    improvements,
    finalAssessment:
      lowEvidence
        ? 'This fallback report found weak evidence of accurate, relevant answers, so the score is intentionally conservative.'
        : 'This fallback report is a conservative estimate generated without full AI grading.',
  };
};
