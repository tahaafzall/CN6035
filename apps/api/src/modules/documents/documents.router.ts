import { Router } from 'express';
import multer from 'multer';

import { requireAuth } from '../../middleware/auth.js';
import { uploadDocumentBuffer } from '../../services/ipfs.service.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ApiError } from '../../utils/api-error.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

export const documentsRouter = Router();

documentsRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      throw ApiError.badRequest('A file upload is required.');
    }

    const result = await uploadDocumentBuffer(
      request.file.buffer,
      request.file.originalname,
      request.file.mimetype
    );

    response.status(201).json(result);
  })
);
