import { Router } from 'express';
import { uploadResume, getResume } from '../controllers/resume.controller.js';
import authenticate from '../middleware/auth.middleware.js';
import { resumeUploadMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);
router.post('/upload', resumeUploadMiddleware, uploadResume);
router.get('/', getResume);

export default router;
