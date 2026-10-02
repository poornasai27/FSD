import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or any origin
      callback(null, true);
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