# MockMate AI Project Documentation

MockMate AI is a full-stack mock interview platform. It lets a user create an account, upload a PDF resume, configure an interview role and difficulty, answer AI-generated questions through text or voice, complete coding questions in a Monaco editor, receive feedback, and review past sessions.

## Project Structure

```text
client/   React + Vite frontend
server/   Express + MongoDB backend
```

The frontend owns the user interface and browser-only capabilities such as routing, local auth storage, microphone recording, audio playback, and the code editor. The backend owns authentication, resume parsing, interview generation, AI calls, transcription, text-to-speech, feedback generation, and database persistence.

## Main User Flow

1. The user opens the app.
2. If not logged in, the user can view the landing page or go to login/register.
3. After login, protected routes become available.
4. The user opens the interview setup wizard.
5. The user selects a role, chooses difficulty, and uploads a PDF resume.
6. The backend extracts text from the resume and stores it for the logged-in user.
7. The user starts an interview.
8. Gemini generates resume-aware interview questions. If Gemini is unavailable, local fallback questions are used.
9. The interview room shows the current question.
10. The user answers through text, voice, or code depending on the question type.
11. Voice answers are sent to AssemblyAI for transcription.
12. Coding answers are evaluated by Gemini. If Gemini is unavailable, fallback code evaluation is used.
13. After the final question or when the user ends the interview, feedback is generated and saved.
14. The feedback page displays scores, category summaries, strengths, improvements, and final assessment.
15. The history page lists previous interviews and allows reopening, deleting, or clearing history.

## Frontend Functionality

### Routing

Routes are defined in `client/src/App.jsx`.

| Route | Purpose | Protection |
| --- | --- | --- |
| `/` | Landing page for guests and dashboard for authenticated users | Public |
| `/login` | Login and registration page | Public |
| `/setup` | Interview setup wizard | Protected |
| `/interview/:id` | Active interview room | Protected |
| `/feedback/:id` | Interview feedback report | Protected |
| `/history` | Interview history archive | Protected |

Protected pages are wrapped with `ProtectedRoute`. If a user is not authenticated, they are redirected to `/login`.

### Authentication UI

Implemented in:

- `client/src/pages/LoginPage/index.jsx`
- `client/src/context/AuthContext.jsx`
- `client/src/services/authService.js`

The login page supports both sign in and account creation. After successful login or registration, the API token and user object are saved in `localStorage` using:

- `aimi_token`
- `aimi_user`

The token is attached to future API requests as:

```text
Authorization: Bearer <token>
```

If the backend returns `401`, the Axios response interceptor clears stored auth data and redirects the user to `/login`.

### Home and Dashboard

Implemented in `client/src/pages/HomePage/index.jsx`.

For guests, the page acts as a marketing/landing page. For logged-in users, it becomes a dashboard that loads interview history, calculates completed sessions, average score, readiness score, recent interviews, and links to start a new simulation or open analytics.

### Interview Setup

Implemented in `client/src/pages/InterviewSetupPage/index.jsx`.

The setup wizard has three steps:

1. Select target role.
2. Choose difficulty.
3. Upload PDF resume.

Supported roles in the UI:

- Frontend
- Backend
- Full Stack
- Data Analyst
- DevOps

Difficulty controls the number of interview questions:

| Difficulty | Total Questions |
| --- | ---: |
| easy | 4 |
| medium | 5 |
| hard | 6 |

The page tries to load an existing saved resume when it mounts. If no resume exists, the user must upload one before starting the interview.

### Resume Upload

The frontend sends the selected PDF as `multipart/form-data` to:

```text
POST /api/resume/upload
```

The backend expects the file field name to be:

```text
resume
```

The uploaded resume is parsed server-side and the extracted text is returned to the frontend. The setup page stores the resume text in state and sends it when starting the interview.

### Interview Room

Implemented in `client/src/pages/InterviewPage/index.jsx`.

The interview page shows:

- Current question number.
- Total question count.
- Session status.
- Role and difficulty.
- Current question text.
- Text answer box for non-coding questions.
- Voice recorder for non-coding questions.
- Code editor for coding questions.
- End interview action.

The status values shown in the UI are:

- `speaking`
- `listening`
- `thinking`
- `farewell`

When a question has `type: "coding"`, the page switches to a coding layout with Monaco Editor. The user must evaluate code before clicking `Next Question`.

### Voice Recording

Implemented in `client/src/components/VoiceRecorder/index.jsx`.

The voice recorder uses the browser `MediaRecorder` API. It asks for microphone access through:

```js
navigator.mediaDevices.getUserMedia({ audio: true })
```

Recording rules:

- Minimum recording time: 3 seconds.
- Maximum recording time: 300 seconds.
- Preferred MIME types: `audio/webm;codecs=opus`, `audio/webm`, then `audio/mp4`.

After recording, the user can preview the audio, submit it, or re-record. Submitted audio is sent as `multipart/form-data` with field name `audio`.

### AI Audio Playback

Implemented in `client/src/components/AudioPlayer/index.jsx`.

When the backend returns Murf-generated audio as base64 MP3, the component:

1. Decodes the base64 string.
2. Converts it to a `Blob`.
3. Creates an object URL.
4. Plays it using the browser `Audio` API.
5. Revokes the object URL after playback/cleanup.

### Code Editor

Implemented in `client/src/components/CodeEditor/index.jsx`.

The editor uses `@monaco-editor/react`, which embeds the Monaco editor used by VS Code. Current configuration:

- Theme: `vs-dark`
- Default language: `javascript`
- Height: `320px`
- Minimap disabled

Code is submitted to:

```text
POST /api/interview/:id/code
```

The response includes an evaluation score, summary, strengths, and improvements.

### Feedback Page

Implemented in `client/src/pages/FeedbackPage/index.jsx`.

The page loads the completed interview by ID. If feedback is missing, it redirects to the dashboard. The report displays:

- Overall score.
- Communication score.
- Technical knowledge score.
- Problem solving score.
- Confidence score.
- Role readiness score.
- Strengths.
- Growth areas.
- Final assessment.

### History Page

Implemented in `client/src/pages/HistoryPage/index.jsx`.

The page displays saved interviews with pagination. It supports:

- Opening completed interviews in feedback view.
- Opening in-progress interviews in interview view.
- Deleting one interview.
- Clearing all interview history.

The page loads 8 items at a time.

## Backend Functionality

### Application Startup

Implemented in:

- `server/src/server.js`
- `server/src/app.js`
- `server/src/config/db.js`

Startup sequence:

1. Load environment variables with `dotenv`.
2. Connect to MongoDB using `MONGODB_URI`.
3. Start the Express server on `PORT` or `5000`.

The backend exposes a health route:

```text
GET /health
```

Response:

```json
{
  "success": true,
  "message": "AI Mock Interview API is running."
}
```

### API Route Groups

All application routes are mounted under `/api`.

| Prefix | File | Purpose |
| --- | --- | --- |
| `/api/auth` | `auth.routes.js` | Register and login |
| `/api/resume` | `resume.routes.js` | Upload and fetch resume |
| `/api/interview` | `interview.routes.js` | Start, answer, transcribe, speak, code, end, fetch interview |
| `/api/history` | `history.routes.js` | List, fetch, delete, and clear history |

### Authentication

Implemented in:

- `server/src/controllers/auth.controller.js`
- `server/src/services/auth.service.js`
- `server/src/middleware/auth.middleware.js`
- `server/src/models/User.model.js`

Registration requires:

- `name`
- `email`
- `password`

Login requires:

- `email`
- `password`

Passwords are hashed with `bcryptjs` before storage. Successful authentication returns:

- JWT token.
- User ID.
- User name.
- User email.

JWT tokens expire in 7 days. Protected backend routes require:

```text
Authorization: Bearer <token>
```

### Resume Parsing and Storage

Implemented in:

- `server/src/controllers/resume.controller.js`
- `server/src/services/resume.service.js`
- `server/src/middleware/upload.middleware.js`
- `server/src/models/Resume.model.js`

Resume upload rules:

- File type must be PDF.
- Max file size is 5 MB.
- File is stored in memory while processing.
- Extracted text is stored in MongoDB.

The parser uses `pdfjs-dist` to read every PDF page, collect text content, and join the result into plain text.

Each user has one saved resume record. Uploading another resume updates the existing record through `findOneAndUpdate` with `upsert`.

### Interview Generation

Implemented in:

- `server/src/controllers/interview.controller.js`
- `server/src/services/interview.service.js`
- `server/src/constants/prompts.js`
- `server/src/utils/prompts.utils.js`
- `server/src/utils/fallback.utils.js`

Starting an interview requires:

- `role`
- `resumeText`
- optional `difficulty`
- optional `totalQuestions`

The backend asks Gemini to generate interview questions tailored to the role and resume. The app always inserts this first question:

```text
Tell me about yourself.
```

Then it appends generated questions and trims to the requested total.

Gemini must return strict JSON. The backend parses it with `parseGeminiJSON`. If the AI response fails or Gemini is unavailable, fallback questions are generated locally.

### Question Safety and Fallbacks

`fallback.utils.js` adds defensive behavior:

- Removes suspicious generated questions that look like PII.
- Rejects overlong generated questions.
- Clamps question text length.
- Builds local fallback questions using role and resume keywords.
- Builds fallback greeting, transition messages, code evaluations, and feedback.

This lets the app continue operating when AI providers fail or API keys are missing.

### Answer Submission

Text answers are submitted to:

```text
POST /api/interview/:id/answer
```

Voice answers are submitted to:

```text
POST /api/interview/:id/answer/voice
```

For every valid answer, the backend:

1. Finds the interview for the authenticated user.
2. Saves the candidate message.
3. Checks whether this was the final question.
4. If final, marks the interview completed and generates feedback.
5. If not final, advances `currentQuestion`.
6. Generates a transition message for the next question.
7. Tries to generate audio for the transition.
8. Saves and returns the next question.

Empty answers are rejected.

### Voice Transcription

Implemented in `server/src/services/assemblyai.service.js`.

Voice transcription uses AssemblyAI:

1. Save uploaded audio temporarily in the OS temp directory.
2. Upload the audio to AssemblyAI.
3. Create a transcript request.
4. Poll until the transcript is completed or fails.
5. Return transcript text.
6. Delete the temporary file.

If the transcript is empty, the user is asked to record again.

### Text-to-Speech

Implemented in `server/src/services/murf.service.js`.

The app uses Murf to generate interviewer audio.

Current Murf configuration:

- Voice ID: `en-US-natalie`
- Locale: `en-US`
- Model: `FALCON`
- Format: `MP3`

There are two backend audio paths:

- `generateAudio(text)` returns base64 audio for normal interview transitions.
- `streamAudio(text, res)` streams MP3 audio directly to the HTTP response for `/api/interview/speak`.

If `MURF_API_KEY` is missing, generated interview audio returns `null`, so the interview can continue silently.

### Coding Evaluation

Implemented in `server/src/services/interview.service.js`.

Coding answers are submitted with:

- `code`
- `language`

The backend sends the current question, language, and submitted code to Gemini for strict evaluation. It stores the code submission in the interview record with:

- question number
- language
- code
- evaluation
- timestamp

If Gemini is unavailable, fallback evaluation gives a conservative score based on whether any code was submitted and reminds the user that correctness could not be verified automatically.

### Feedback Generation

Feedback is generated when:

- The final question is answered.
- The user manually ends the interview.

Gemini receives:

- Role.
- Full transcript.
- Code submission summaries.

It returns strict JSON with:

- `overallScore`
- category scores and summaries
- strengths
- improvements
- final assessment

Fallback feedback is generated locally if Gemini is unavailable. The fallback scoring is intentionally conservative and analyzes answer length, repeated words, generic responses, relevance to question terms, expected topic overlap, and code submission scores.

### History

Implemented in:

- `server/src/controllers/history.controller.js`
- `server/src/services/history.service.js`

History is based on saved `Interview` documents. The history list returns:

- role
- status
- overall score
- total questions
- current question
- creation date

History supports:

- Pagination.
- Single interview deletion.
- Clearing all interviews for the user.
- Opening a full interview by ID.

## Data Models

### User

Defined in `server/src/models/User.model.js`.

Fields:

- `name`
- `email`
- `password`
- `createdAt`
- `updatedAt`

Email is unique, lowercased, and trimmed. Password has a minimum length of 6.

### Resume

Defined in `server/src/models/Resume.model.js`.

Fields:

- `userId`
- `fileName`
- `extractedText`
- `createdAt`
- `updatedAt`

`userId` is indexed for faster user-specific lookup.

### Interview

Defined in `server/src/models/Interview.model.js`.

Fields:

- `userId`
- `role`
- `difficulty`
- `totalQuestions`
- `currentQuestion`
- `questions`
- `messages`
- `codeSubmissions`
- `status`
- `overallScore`
- `feedback`
- `createdAt`
- `updatedAt`

Interview status can be:

- `in-progress`
- `completed`

Question type can be:

- `behavioral`
- `technical`
- `coding`

Message sender can be:

- `ai`
- `candidate`

## API Reference

### Auth

```text
POST /api/auth/register
```

Body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

```text
POST /api/auth/login
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Resume

Requires authentication.

```text
POST /api/resume/upload
```

Form data:

```text
resume=<PDF file>
```

```text
GET /api/resume
```

Returns the saved resume for the authenticated user.

### Interview

Requires authentication.

```text
POST /api/interview/start
```

Body:

```json
{
  "role": "Full Stack",
  "difficulty": "medium",
  "totalQuestions": 5,
  "resumeText": "Extracted resume text..."
}
```

```text
GET /api/interview/:id
```

Returns the interview document for the authenticated user.

```text
POST /api/interview/:id/answer
```

Body:

```json
{
  "answer": "Candidate answer..."
}
```

```text
POST /api/interview/:id/answer/voice
```

Form data:

```text
audio=<audio file>
```

```text
POST /api/interview/transcribe
```

Form data:

```text
audio=<audio file>
```

Transcribes audio without submitting it as an interview answer.

```text
POST /api/interview/:id/code
```

Body:

```json
{
  "code": "function solve() {}",
  "language": "javascript"
}
```

```text
POST /api/interview/:id/end
```

Ends the interview and generates feedback.

```text
POST /api/interview/speak
```

Body:

```json
{
  "text": "Text to speak"
}
```

Streams MP3 audio if Murf is configured.

### History

Requires authentication.

```text
GET /api/history?page=1&limit=10
```

```text
GET /api/history/:id
```

```text
DELETE /api/history/:id
```

```text
DELETE /api/history/clear
```

## Environment Variables

### Server

Expected in `server/.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Backend port. Defaults to `5000`. |
| `CLIENT_URL` | No | Allowed CORS origin. Defaults to `http://localhost:5173`. |
| `MONGODB_URI` | Yes for persistence | MongoDB connection string. |
| `JWT_SECRET` | Recommended | Secret used to sign JWT tokens. Defaults to `dev-secret` if missing. |
| `GEMINI_API_KEY` | No, but needed for AI quality | Enables question generation, transitions, feedback, and code evaluation. |
| `MURF_API_KEY` | No | Enables AI interviewer speech audio. |
| `ASSEMBLYAI_API_KEY` | Needed for voice answers | Enables voice transcription. |

### Client

Expected in `client/.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | No | Backend API base URL. Defaults to `http://localhost:5000/api`. |

## Why These Technologies Were Used

### React

React is used because the app has a stateful, interactive interface: authentication state, setup steps, recording state, current question state, code editor state, feedback views, and history pagination. React components make these UI pieces reusable and easier to reason about.

### Vite

Vite is used for the frontend build tool because it provides fast local development, simple configuration, and modern ES module support. This fits a React app where quick UI iteration is important.

### React Router

React Router is used because the app has multiple client-side screens: dashboard, login, setup, interview, feedback, and history. It also supports protected routes and route parameters like `/interview/:id`.

### Axios

Axios is used for HTTP requests because it has a clean API for JSON requests, `multipart/form-data` uploads, response interceptors, and default headers. The app uses this to attach JWT tokens and handle expired sessions globally.

### React Hot Toast

React Hot Toast is used for user feedback such as successful login, upload failures, transcription errors, code evaluation success, and history actions. Toasts avoid blocking the workflow.

### Monaco Editor

Monaco Editor is used because coding interview questions need a real editor experience instead of a plain textarea. It provides syntax highlighting, editor theming, and familiar coding ergonomics.

### Express

Express is used for the backend because it is lightweight, mature, and well-suited for REST APIs. The app organizes routes, controllers, middleware, and services around Express.

### MongoDB and Mongoose

MongoDB is used because the data is document-oriented: users have resumes, interviews contain nested questions, messages, code submissions, and flexible AI feedback. Mongoose adds schemas, validation, model methods, indexes, and a cleaner API over MongoDB.

### JWT

JWT is used because the frontend and backend are separate apps. A signed token lets the frontend authenticate requests without server-side sessions.

### bcryptjs

`bcryptjs` is used to hash user passwords before storage. This prevents storing plain-text passwords in MongoDB.

### Multer

Multer is used because the app accepts uploaded files: PDF resumes and audio answers. It handles `multipart/form-data` and stores uploads in memory for immediate processing.

### pdfjs-dist

`pdfjs-dist` is used to extract text from uploaded PDF resumes. This lets the AI generate questions based on resume content instead of asking generic questions.

### Gemini

Gemini is used for the AI reasoning parts of the platform:

- Resume-aware question generation.
- Interview greeting.
- Natural transition messages.
- Code review.
- Final feedback and scoring.

The selected model in code is `gemini-2.5-flash`, which is suitable for fast interactive AI responses.

### Murf

Murf is used for text-to-speech so the AI interviewer can speak prompts and transitions. This makes the mock interview feel closer to a real spoken interview.

### AssemblyAI

AssemblyAI is used for speech-to-text. It converts user voice recordings into text so the same answer evaluation pipeline can handle both typed and spoken answers.

### CORS

CORS is configured because the frontend and backend usually run on different local ports during development. The backend allows the configured client origin to call the API.

### dotenv

`dotenv` is used so secrets and environment-specific settings stay outside the source code.

## Error Handling and Reliability

The backend uses a central error middleware that returns consistent JSON errors:

```json
{
  "success": false,
  "message": "Error message"
}
```

The app also has fallback behavior:

- Missing Gemini key causes local fallback questions, feedback, and code evaluation.
- Missing Murf key disables audio generation but does not stop interviews.
- Missing AssemblyAI key prevents voice transcription, but text answers still work.
- Missing MongoDB URI logs a warning, but persistence features require MongoDB to work correctly.

## Important Implementation Notes

- `node_modules` and `client/dist` are present in the workspace but are generated outputs/dependencies, not source code.
- The root folder is currently not a Git repository.
- Voice answers require browser microphone permission.
- Voice answer transcription requires `ASSEMBLYAI_API_KEY`.
- Interview audio requires `MURF_API_KEY`.
- High-quality AI question generation and feedback require `GEMINI_API_KEY`.
- Authentication, resume storage, interview history, and feedback persistence require MongoDB.

## Interview Questions and Answers

This section explains the most common project questions that can be asked during a technical interview, viva, review, or demo.

### How is the voice recorded?

Voice is recorded in the frontend using the browser `MediaRecorder` API inside `client/src/components/VoiceRecorder/index.jsx`.

The recording flow is:

1. The user clicks `Start Recording`.
2. The browser asks for microphone permission through `navigator.mediaDevices.getUserMedia({ audio: true })`.
3. If permission is granted, a `MediaRecorder` instance starts capturing audio.
4. Audio chunks are collected through the `ondataavailable` event.
5. When the user stops recording, the chunks are combined into a `Blob`.
6. The app creates a temporary object URL with `URL.createObjectURL(blob)` so the user can preview the recording.
7. The user can submit the recording or re-record it.

The recorder enforces:

- Minimum recording time: 3 seconds.
- Maximum recording time: 300 seconds.
- Preferred audio formats: `audio/webm;codecs=opus`, `audio/webm`, then `audio/mp4`.

### How is a voice answer submitted?

When the user submits a voice answer, the frontend sends the audio blob as `multipart/form-data` to:

```text
POST /api/interview/:id/answer/voice
```

The form field name is:

```text
audio
```

The browser-side service is implemented in `client/src/services/interviewService.js`. It appends the blob like this:

```js
formData.append('audio', audioBlob, 'answer.webm');
```

### How is voice converted into text?

Voice transcription happens in the backend using AssemblyAI, implemented in `server/src/services/assemblyai.service.js`.

The backend flow is:

1. The uploaded audio buffer is received by Multer.
2. The audio is temporarily written to the operating system temp directory.
3. The file is uploaded to AssemblyAI.
4. AssemblyAI returns an uploaded audio URL.
5. The backend creates a transcript request using that URL.
6. The backend polls AssemblyAI every 1.5 seconds until transcription completes or fails.
7. The transcript text is returned.
8. The temporary local audio file is deleted in the `finally` block.

After transcription, the transcript is treated like a normal text answer and passed to the same interview answer pipeline.

### What happens if the voice transcript is empty?

If AssemblyAI returns an empty transcript, the backend rejects the answer with a validation error. The user is asked to record again or type the answer manually. This avoids saving blank answers into the interview conversation.

### How is the resume uploaded?

The resume is uploaded from `client/src/pages/InterviewSetupPage/index.jsx` to:

```text
POST /api/resume/upload
```

The upload uses `multipart/form-data`, and the expected field name is:

```text
resume
```

The backend uses Multer in `server/src/middleware/upload.middleware.js` to accept the file. Resume uploads are restricted to PDF files with a maximum size of 5 MB.

### How is text extracted from the resume?

Resume parsing is implemented in `server/src/services/resume.service.js`.

The backend uses `pdfjs-dist` to parse the PDF:

1. The uploaded PDF buffer is converted into a `Uint8Array`.
2. `pdfjs-dist` loads the PDF document.
3. The service loops through every page.
4. For each page, it calls `getTextContent()`.
5. It extracts each text item from the page and joins it into plain text.
6. Text from all pages is joined and trimmed.

The extracted resume text is stored in MongoDB in the `Resume` model.

### How are questions generated from the resume?

Question generation happens in `server/src/services/interview.service.js` using the prompt from `server/src/constants/prompts.js`.

When the user starts an interview, the frontend sends:

- selected role
- difficulty
- total question count
- extracted resume text

The backend calls Gemini with `GENERATE_QUESTIONS_PROMPT`. The prompt asks Gemini to analyze the resume and generate interview questions tailored to the selected role.

The app always adds this question first:

```text
Tell me about yourself.
```

Gemini generates the remaining questions. For example, if the total question count is 5, Gemini is asked to generate 4 questions because the first one is already fixed.

### What format does Gemini return for questions?

Gemini is instructed to return strict JSON:

```json
{
  "questions": [
    {
      "text": "Question text",
      "type": "behavioral",
      "expectedTopics": ["topic1", "topic2"]
    }
  ]
}
```

Each question includes:

- `text`: the actual question shown to the user.
- `type`: `behavioral`, `technical`, or `coding`.
- `expectedTopics`: topics that help later feedback and fallback scoring.

The backend parses this with `parseGeminiJSON`.

### How does the app decide the number of questions?

The frontend maps difficulty to total questions:

| Difficulty | Questions |
| --- | ---: |
| easy | 4 |
| medium | 5 |
| hard | 6 |

The backend receives `totalQuestions` and trims the final question list to that number.

### How does the app make sure questions are safe?

The backend sanitizes generated questions using helpers in `server/src/utils/fallback.utils.js`.

The safety logic:

- Removes suspicious generated questions that look like personal data.
- Prevents raw resume contact details from becoming questions.
- Rejects or clamps overly long questions.
- Falls back to local questions if the AI response is invalid.

The prompt also tells Gemini not to paste raw resume lines, emails, phone numbers, contact details, or links.

### What happens if Gemini fails?

If Gemini is unavailable, the API key is missing, or the JSON response is invalid, the app uses local fallback logic.

Fallback questions are generated by `buildFallbackQuestions()` in `server/src/utils/fallback.utils.js`. The fallback uses the role and selected resume keywords to create reasonable behavioral, technical, and coding questions.

This allows the interview to continue even without Gemini.

### How are coding questions handled?

Questions can have `type: "coding"`. When the current question is a coding question, the frontend shows Monaco Editor instead of the normal text and voice answer layout.

The code is submitted to:

```text
POST /api/interview/:id/code
```

The backend sends the role, question, language, and submitted code to Gemini through `EVALUATE_CODE_PROMPT`. Gemini returns a strict JSON evaluation with:

- score
- summary
- strengths
- improvements

The code submission and evaluation are stored in the interview document.

### How does the app move from one question to the next?

For every valid answer, `submitAnswer()` in `server/src/services/interview.service.js`:

1. Finds the interview for the logged-in user.
2. Saves the candidate answer in `messages`.
3. Checks whether the current question is the final question.
4. If it is not final, increments `currentQuestion`.
5. Generates a short transition message for the next question.
6. Tries to create audio for that transition.
7. Saves the updated interview.
8. Returns the next question to the frontend.

If the answer was for the final question, the interview is marked as completed and feedback is generated.

### How is interviewer speech generated?

Interviewer speech is generated by Murf in `server/src/services/murf.service.js`.

The backend sends text to Murf using:

- voice ID: `en-US-natalie`
- locale: `en-US`
- model: `FALCON`
- format: `MP3`

For normal interview transitions, Murf audio is returned as base64 MP3. The frontend decodes it in `client/src/components/AudioPlayer/index.jsx`, creates a blob URL, and plays it with the browser `Audio` API.

If `MURF_API_KEY` is missing, audio generation returns `null`, and the interview continues without speech.

### How is feedback generated?

Feedback is generated when:

- the final question is answered, or
- the user manually ends the interview.

The backend builds a transcript from all interview messages and includes summaries of coding submissions. Gemini receives this through `FEEDBACK_PROMPT` and returns strict JSON containing:

- overall score
- communication score
- technical knowledge score
- problem solving score
- confidence score
- role readiness score
- strengths
- improvements
- final assessment

If Gemini fails, the backend creates fallback feedback locally.

### How does fallback feedback work?

Fallback feedback is generated in `server/src/utils/fallback.utils.js`.

It analyzes available evidence such as:

- whether answers are empty or meaningful
- answer length
- repeated words
- generic responses
- relevance to question terms
- overlap with expected topics
- coding evaluation scores

The fallback score is intentionally conservative because it cannot fully verify technical correctness like Gemini can.

### How is interview history saved?

Each interview is stored in MongoDB using the `Interview` model.

The saved interview contains:

- user ID
- role
- difficulty
- total questions
- current question number
- generated questions
- candidate and AI messages
- code submissions
- status
- feedback
- overall score

The history page fetches these saved interviews from `/api/history`.

### How is authentication handled?

Authentication uses JWT.

When a user registers or logs in:

1. The backend validates the credentials.
2. Passwords are hashed with `bcryptjs`.
3. A JWT is generated.
4. The frontend stores the token in `localStorage` as `aimi_token`.
5. Axios attaches the token to protected API requests as `Authorization: Bearer <token>`.

Protected backend routes use auth middleware to verify the JWT and attach the user to the request.

### Why is MongoDB used?

MongoDB fits this project because interview data is document-shaped. A single interview contains nested questions, messages, code submissions, and AI feedback. Mongoose schemas provide validation and a clean way to work with those nested documents.

### Why is React used?

React is used because the frontend has many stateful screens and components:

- login/register state
- resume upload state
- setup wizard state
- current question state
- voice recording state
- audio playback state
- coding editor state
- feedback report state
- history pagination state

React makes these UI states easier to manage through components and hooks.

### Why is Express used?

Express is used to build a REST API for authentication, resume upload, interview sessions, voice transcription, code evaluation, feedback generation, and history. Its middleware model works well for auth checks, file uploads, CORS, and centralized error handling.

### Why is Multer used?

Multer handles `multipart/form-data` uploads. This project needs file uploads for:

- PDF resumes
- audio answers

Both files are processed server-side after upload.

### Why does the app need API keys?

The app depends on external AI services:

| API Key | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Generates questions, transitions, code reviews, and feedback |
| `ASSEMBLYAI_API_KEY` | Converts voice recordings into text |
| `MURF_API_KEY` | Converts interviewer text into speech |

Without these keys, some features fall back gracefully, but voice transcription specifically requires AssemblyAI.

### What are the main security considerations?

Main security measures include:

- Password hashing with `bcryptjs`.
- JWT authentication for protected routes.
- Authenticated access to user-specific resumes and interviews.
- PDF-only resume upload validation.
- 5 MB resume file size limit.
- In-memory upload handling for resumes and audio.
- Prompt rules to avoid exposing raw resume contact details in generated questions.

### What are the main limitations?

Current limitations include:

- Only PDF resumes are supported.
- Each user has one saved resume record.
- Voice transcription depends on AssemblyAI.
- AI-quality questions and feedback depend on Gemini.
- Text-to-speech depends on Murf.
- Coding evaluation is AI-based and does not execute code against test cases.
- The app currently uses a fixed default coding language of JavaScript in the editor.

## Suggested Future Improvements

- Add automated tests for auth, interview, resume upload, and feedback generation.
- Add server-side input validation with a schema library.
- Add refresh tokens or session renewal.
- Add support for multiple resumes per user.
- Add more coding languages in the UI.
- Add rate limiting for auth and AI endpoints.
- Add confirmation dialogs before deleting or clearing history.
- Add a production deployment guide.
