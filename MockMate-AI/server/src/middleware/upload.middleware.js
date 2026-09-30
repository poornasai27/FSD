import multer from 'multer';

const storage = multer.memoryStorage();

const resumeUploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed.'));
      return;
    }
    cb(null, true);
  },
}).single('resume');

const audioUploadMiddleware = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('audio');

export { resumeUploadMiddleware, audioUploadMiddleware };
