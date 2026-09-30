import mongoose from 'mongoose';

let didWarnMissingMongo = false;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    if (!didWarnMissingMongo) {
      console.warn('MONGODB_URI is not set. Configure it before starting the backend.');
      didWarnMissingMongo = true;
    }
    return;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    if (error.message.includes('whitelisted') || error.name === 'MongooseServerSelectionError') {
      console.error(
        'Action Required: Please whitelist your IP address in MongoDB Atlas Network Access (cloud.mongodb.com).'
      );
    }
    throw error;
  }
};

export default connectDB;
