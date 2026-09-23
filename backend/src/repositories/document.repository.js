const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const documents = new Map();
const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.gif']);
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/gif',
]);

fs.mkdirSync(storageDirectory, { recursive: true });

function sanitizeOriginalName(originalName = 'documento') {
  const safeName = path.basename(originalName || 'documento')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

  return safeName || 'documento';
}

function resolveStoragePath(filePath) {
  if (!filePath) {
    throw new Error('Caminho do arquivo inválido.');
  }

  const normalizedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(storageDirectory, filePath);

  const relativePath = path.relative(storageDirectory, normalizedPath);
  const isOutsideStorage = relativePath.startsWith('..') || path.isAbsolute(relativePath);

  if (isOutsideStorage) {
    throw new Error('O caminho do arquivo está fora do diretório de armazenamento.');
  }

  return normalizedPath;
}

function isAllowedFileType(file) {
  if (!file) {
    return false;
  }

  const fileName = (file.originalname || '').toLowerCase();
  const extension = path.extname(fileName);
  const mimeType = (file.mimetype || '').toLowerCase();

  return allowedExtensions.has(extension) || allowedMimeTypes.has(mimeType);
}

function toPublicMetadata(document) {
  const { storageName, storagePath, ...metadata } = document;
  return metadata;
}

function create(documentFile, owner) {
  if (!documentFile || !documentFile.path) {
    throw new Error('Arquivo inválido para upload.');
  }

  if (!isAllowedFileType(documentFile)) {
    throw new Error('Tipo de arquivo não permitido.');
  }

  const id = crypto.randomUUID();
  const metadata = {
    id,
    originalName: sanitizeOriginalName(documentFile.originalname),
    size: documentFile.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: documentFile.filename,
    storagePath: resolveStoragePath(documentFile.path),
  };

  documents.set(id, metadata);
  return toPublicMetadata(metadata);
}

function listByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .map(toPublicMetadata);
}

function findById(id) {
  return documents.get(id) || null;
}

function getStorageDirectory() {
  return storageDirectory;
}

function remove(id) {
  documents.delete(id);
}

module.exports = {
  create,
  listByOwner,
  findById,
  getStorageDirectory,
  remove,
  resolveStoragePath,
  isAllowedFileType,
};
