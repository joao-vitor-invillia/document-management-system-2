const fs = require('node:fs/promises');
const documentRepository = require('../repositories/document.repository');

class DocumentServiceError extends Error {
  constructor(code, message, statusCode) {
    super(message);
    this.name = 'DocumentServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function createServiceError(code, message, statusCode) {
  return new DocumentServiceError(code, message, statusCode);
}

function validateUploadedFile(file) {
  if (!file || !file.path || file.size === 0) {
    throw createServiceError(
      'FILE_REQUIRED',
      'Um arquivo não vazio deve ser enviado no campo file.',
      400,
    );
  }
}

async function removeUploadedFile(filePath) {
  await fs.rm(filePath, { force: true }).catch(() => {});
}

function getDocumentOrThrow(id) {
  if (!id) {
    throw createServiceError(
      'INVALID_DOCUMENT_ID',
      'O identificador do documento é obrigatório.',
      400,
    );
  }

  const document = documentRepository.findById(id);

  if (!document) {
    throw createServiceError(
      'DOCUMENT_NOT_FOUND',
      'Documento não encontrado.',
      404,
    );
  }

  return document;
}

function ensureDocumentOwnership(document, owner) {
  if (document.owner !== owner) {
    throw createServiceError(
      'DOCUMENT_FORBIDDEN',
      'O usuário não tem acesso a este documento.',
      403,
    );
  }
}

async function ensureStoredFileExists(storagePath) {
  try {
    await fs.access(storagePath);
  } catch {
    throw createServiceError(
      'FILE_NOT_FOUND',
      'O arquivo do documento não está disponível.',
      404,
    );
  }
}

async function uploadDocument(file, owner) {
  validateUploadedFile(file);

  try {
    return documentRepository.create(file, owner);
  } catch (error) {
    await removeUploadedFile(file.path);
    throw createServiceError(
      'STORAGE_ERROR',
      'Não foi possível registrar o documento.',
      500,
    );
  }
}

function listDocuments(owner) {
  return documentRepository.listByOwner(owner);
}

async function downloadDocument(id, owner) {
  const document = getDocumentOrThrow(id);

  ensureDocumentOwnership(document, owner);
  await ensureStoredFileExists(document.storagePath);

  return document;
}

module.exports = {
  DocumentServiceError,
  uploadDocument,
  listDocuments,
  downloadDocument,
};
