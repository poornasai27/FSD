import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

dotenv.config({ override: true });

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
};

startServer();

export default async (req, res) => {
  await connectDB();
  return app(req, res);
};
