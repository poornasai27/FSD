# MockMate AI

Full-stack AI-powered mock interview platform with:

- Resume-based question generation
- Voice interview support hooks for Murf AI and AssemblyAI
- Live coding with Monaco
- AI feedback and interview history

## Stack

- `server/`: Express, MongoDB, JWT auth
- `client/`: React, Vite, React Router

## Setup

1. Copy `server/.env.example` to `server/.env`
2. Copy `client/.env.example` to `client/.env`
3. Add your MongoDB, Gemini, Murf, and AssemblyAI keys
4. Install dependencies:

```bash
cd server
npm install
cd ../client
npm install
```

5. Start both apps:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

## Notes

- If Gemini, Murf, or AssemblyAI keys are missing, the app uses graceful local fallbacks where possible.
- MongoDB is still required for authentication, resumes, interviews, and history persistence.
