import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://fsd-gules.vercel.app',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'AI Mock Interview API is running.',
  });
});

app.use('/api', routes);

app.use(errorMiddleware);

export default app;