import multer from 'multer';
import { ALLOWED_DOCUMENT_MIMES, MAX_DOCUMENT_SIZE_BYTES } from '../config/upload.js';

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  if (ALLOWED_DOCUMENT_MIMES.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Allowed formats: PDF, JPG, PNG'));
  }
};

export const uploadDocumentMiddleware = multer({
  storage,
  limits: { fileSize: MAX_DOCUMENT_SIZE_BYTES },
  fileFilter,
}).single('file');
