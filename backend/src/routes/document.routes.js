const express = require('express');
const multer = require('multer');
const path = require('node:path');
const documentRepository = require('../repositories/document.repository');
const documentController = require('../controllers/document.controller');

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, documentRepository.getStorageDirectory());
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    files: 1,
  },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = {
  router,
  upload,
};
