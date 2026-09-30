import Interview from '../models/Interview.model.js';

export const getUserHistory = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [entries, totalEntries] = await Promise.all([
    Interview.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('role status overallScore totalQuestions currentQuestion createdAt'),
    Interview.countDocuments({ userId }),
  ]);

  return {
    entries,
    totalEntries,
    page,
    totalPages: Math.max(1, Math.ceil(totalEntries / limit)),
  };
};

export const getHistoryItemById = async (id, userId) => {
  const item = await Interview.findOne({ _id: id, userId });
  if (!item) {
    const error = new Error('History item not found');
    error.statusCode = 404;
    throw error;
  }
  return item;
};

export const deleteHistoryItemById = async (id, userId) => {
  const deleted = await Interview.findOneAndDelete({ _id: id, userId });
  if (!deleted) {
    const error = new Error('History item not found');
    error.statusCode = 404;
    throw error;
  }
  return deleted;
};

export const clearUserHistory = async (userId) => Interview.deleteMany({ userId });
