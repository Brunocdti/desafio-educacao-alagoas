import { Router } from 'express';
import multer from 'multer';
import { AppError } from '../lib/errors';
import { uploadStore } from '../coredb/upload';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      cb(new AppError('Arquivo precisa ter extensão .csv'));
      return;
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.post('/upload', upload.single('arquivo'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Nenhum arquivo enviado. Envie um campo "arquivo" multipart/form-data.');
    }
    const resumo = await uploadStore.processarUpload(req.file.buffer);
    res.status(200).json(resumo);
  } catch (err) {
    next(err);
  }
});
