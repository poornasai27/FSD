import multer from 'multer';

const storage = multer.memoryStorage();

const resumeUploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/octet-stream',
    ];
    const extension = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload a PDF, DOC, DOCX, or TXT resume.'));
    }
  },
}).single('resume');

const audioUploadMiddleware = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
}).single('audio');

export { resumeUploadMiddleware, audioUploadMiddleware };
