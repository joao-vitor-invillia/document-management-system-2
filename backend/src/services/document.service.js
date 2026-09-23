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

async function uploadDocument(file, owner) {
  if (!file || !file.path || file.size === 0) {
    throw new DocumentServiceError(
      'FILE_REQUIRED',
      'Um arquivo não vazio deve ser enviado no campo file.',
      400,
    );
  }

  try {
    return documentRepository.create(file, owner);
  } catch (error) {
    await fs.rm(file.path, { force: true }).catch(() => {});
    throw new DocumentServiceError(
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
  if (!id) {
    throw new DocumentServiceError(
      'INVALID_DOCUMENT_ID',
      'O identificador do documento é obrigatório.',
      400,
    );
  }

  const document = documentRepository.findById(id);

  if (!document) {
    throw new DocumentServiceError(
      'DOCUMENT_NOT_FOUND',
      'Documento não encontrado.',
      404,
    );
  }

  if (document.owner !== owner) {
    throw new DocumentServiceError(
      'DOCUMENT_FORBIDDEN',
      'O usuário não tem acesso a este documento.',
      403,
    );
  }

  try {
    await fs.access(document.storagePath);
  } catch {
    throw new DocumentServiceError(
      'FILE_NOT_FOUND',
      'O arquivo do documento não está disponível.',
      404,
    );
  }

  return document;
}

module.exports = {
  DocumentServiceError,
  uploadDocument,
  listDocuments,
  downloadDocument,
};
