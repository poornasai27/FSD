import * as historyService from '../services/history.service.js';

export const getHistory = async (req, res, next) => {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const data = await historyService.getUserHistory(req.user._id, page, limit);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getHistoryItem = async (req, res, next) => {
  try {
    const data = await historyService.getHistoryItemById(req.params.id, req.user._id);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteHistoryItem = async (req, res, next) => {
  try {
    await historyService.deleteHistoryItemById(req.params.id, req.user._id);
    return res.json({ success: true, message: 'History item deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const clearHistory = async (req, res, next) => {
  try {
    await historyService.clearUserHistory(req.user._id);
    return res.json({ success: true, message: 'Interview history cleared successfully.' });
  } catch (error) {
    next(error);
  }
};
