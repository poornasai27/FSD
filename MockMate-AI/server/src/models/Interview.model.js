import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: String,
    type: {
      type: String,
      enum: ['behavioral', 'technical', 'coding'],
      default: 'technical',
    },
    expectedTopics: [String],
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['ai', 'candidate'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    questionNumber: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const codeSubmissionSchema = new mongoose.Schema(
  {
    questionNumber: Number,
    language: String,
    code: String,
    evaluation: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      default: 'Resume Interview',
    },
    difficulty: {
      type: String,
      default: 'medium',
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 5,
    },
    currentQuestion: {
      type: Number,
      default: 1,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    codeSubmissions: {
      type: [codeSubmissionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress',
      index: true,
    },
    overallScore: {
      type: Number,
      default: null,
    },
    feedback: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
