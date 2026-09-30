import { Router } from 'express';
import {
  startInterview,
  submitTextAnswer,
  submitVoiceAnswer,
  submitCode,
  endInterview,
  getInterview,
  transcribeOnly,
  speakText,
} from '../controllers/interview.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { audioUploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);
router.post('/start', startInterview);
router.post('/transcribe', audioUploadMiddleware, transcribeOnly);
router.post('/speak', speakText);
router.get('/:id', getInterview);
router.post('/:id/answer', submitTextAnswer);
router.post('/:id/answer/voice', audioUploadMiddleware, submitVoiceAnswer);
router.post('/:id/code', submitCode);
router.post('/:id/end', endInterview);

export default router;
