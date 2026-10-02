export const GENERATE_QUESTIONS_PROMPT = (role, resumeText, totalQuestions, difficulty = 'medium') => `You are an expert technical interviewer conducting a mock interview.
Target difficulty level: ${difficulty.toUpperCase()}.
Analyze the candidate resume below and generate exactly ${totalQuestions - 1} interview questions.
The FIRST question "Tell me about yourself and your experience" is already added, so do not include it.

Return strict JSON in this format:
{
  "questions": [
    {
      "text": "Question text",
      "type": "behavioral" | "technical" | "coding",
      "expectedTopics": ["topic1", "topic2"]
    }
  ]
}

Rules:
1. Tailor questions DIRECTLY to the skills, programming languages, frameworks, tools, and projects in the resume.
2. If resume mentions e.g. Python, React, MongoDB, ask questions on those technologies. If Java, AWS, Spring Boot, ask on those instead.
3. Difficulty setting:
   - EASY: basic fundamental concepts and simple resume/project questions.
   - MEDIUM: moderate technical questions, practical scenario reasoning, and resume-based problem solving.
   - HARD: high-level architecture, deep skill questions, complex scenario problem-solving, and advanced technical depth.
4. Include at least 1 coding question.
5. Each question must be concise (max 35 words).
6. Never paste raw contact details, links, phone numbers, or emails.

Resume:
${resumeText}`;

export const INTERVIEW_GREETING_PROMPT = (role) => `You are InterviewMate AI, a warm but professional AI technical interviewer.
Create a short greeting for a ${role} mock interview. Mention that the first question is "Tell me about yourself".
Keep it under 60 words.`;

export const FOLLOW_UP_PROMPT = (role, conversationHistory, nextQuestion) => `You are InterviewMate AI, a ${role} interviewer.
Use the conversation history to give a short, natural transition into the next question.
Keep it concise and conversational.

Conversation:
${conversationHistory}

Next question:
${nextQuestion}`;

export const FEEDBACK_PROMPT = (role, transcript, codeSummary) => `You are grading a ${role} mock interview.
Grade strictly. Do NOT reward confidence, length, or fluency if the answer is inaccurate, vague, generic, evasive, off-topic, or technically wrong.
Use the full 0-100 range honestly.
Scoring guidance:
- 0-20: no meaningful answer, wrong, irrelevant, or unusable
- 21-40: weak understanding, shallow or mostly incorrect
- 41-60: partial understanding with major gaps
- 61-80: solid but imperfect
- 81-100: strong, specific, accurate, and well-reasoned

Return strict JSON using this structure:
{
  "overallScore": 0,
  "categories": {
    "communication": { "score": 0, "summary": "" },
    "technicalKnowledge": { "score": 0, "summary": "" },
    "problemSolving": { "score": 0, "summary": "" },
    "confidence": { "score": 0, "summary": "" },
    "roleReadiness": { "score": 0, "summary": "" }
  },
  "strengths": ["", ""],
  "improvements": ["", ""],
  "finalAssessment": ""
}

Transcript:
${transcript}

Code summary:
${codeSummary || 'No coding submission provided.'}`;

export const EVALUATE_CODE_PROMPT = (role, question, code, language) => `You are reviewing a ${role} candidate's coding answer.
Grade strictly. Do not award a medium score just because code exists.
If the code is incorrect, incomplete, trivial, off-topic, or fails to address the question, score it low.

Return strict JSON:
{
  "score": 0,
  "summary": "",
  "strengths": ["", ""],
  "improvements": ["", ""]
}

Question:
${question}

Language: ${language}

Code:
${code}`;

export const buildConversationHistory = (messages = []) =>
  messages
    .slice(-20)
    .map((message) => `${message.sender.toUpperCase()}: ${message.text}`)
    .join('\n');
