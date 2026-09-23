const { afterEach, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const documentRepository = require('../src/repositories/document.repository');
const documentService = require('../src/services/document.service');

const originalCreate = documentRepository.create;
const originalFindById = documentRepository.findById;
const originalAccess = fs.access;
const originalRm = fs.rm;

afterEach(() => {
  documentRepository.create = originalCreate;
  documentRepository.findById = originalFindById;
  fs.access = originalAccess;
  fs.rm = originalRm;
});

test('uploadDocument rejeita arquivo ausente ou vazio', async () => {
  await assert.rejects(
    () => documentService.uploadDocument(null, 'user-1'),
    {
      name: 'DocumentServiceError',
      code: 'FILE_REQUIRED',
      message: 'Um arquivo não vazio deve ser enviado no campo file.',
      statusCode: 400,
    },
  );

  await assert.rejects(
    () => documentService.uploadDocument({ path: 'storage/doc.txt', size: 0 }, 'user-1'),
    {
      name: 'DocumentServiceError',
      code: 'FILE_REQUIRED',
      message: 'Um arquivo não vazio deve ser enviado no campo file.',
      statusCode: 400,
    },
  );
});

test('uploadDocument remove o arquivo quando o repositório falha', async () => {
  const file = { path: 'storage/doc.txt', size: 10 };
  let removedPath;
  let removedOptions;

  documentRepository.create = () => {
    throw new Error('repository failure');
  };
  fs.rm = async (filePath, options) => {
    removedPath = filePath;
    removedOptions = options;
  };

  await assert.rejects(
    () => documentService.uploadDocument(file, 'user-1'),
    {
      name: 'DocumentServiceError',
      code: 'STORAGE_ERROR',
      message: 'Não foi possível registrar o documento.',
      statusCode: 500,
    },
  );

  assert.strictEqual(removedPath, file.path);
  assert.deepStrictEqual(removedOptions, { force: true });
});

test('downloadDocument valida id obrigatório', async () => {
  await assert.rejects(
    () => documentService.downloadDocument('', 'user-1'),
    {
      name: 'DocumentServiceError',
      code: 'INVALID_DOCUMENT_ID',
      message: 'O identificador do documento é obrigatório.',
      statusCode: 400,
    },
  );
});

test('downloadDocument retorna erro quando o documento não existe', async () => {
  documentRepository.findById = () => null;

  await assert.rejects(
    () => documentService.downloadDocument('doc-1', 'user-1'),
    {
      name: 'DocumentServiceError',
      code: 'DOCUMENT_NOT_FOUND',
      message: 'Documento não encontrado.',
      statusCode: 404,
    },
  );
});

test('downloadDocument retorna erro quando o usuário não é dono do documento', async () => {
  documentRepository.findById = () => ({
    id: 'doc-1',
    owner: 'other-user',
    storagePath: '/storage/doc-1.txt',
  });

  await assert.rejects(
    () => documentService.downloadDocument('doc-1', 'user-1'),
    {
      name: 'DocumentServiceError',
      code: 'DOCUMENT_FORBIDDEN',
      message: 'O usuário não tem acesso a este documento.',
      statusCode: 403,
    },
  );
});

test('downloadDocument retorna erro quando o arquivo armazenado não existe', async () => {
  documentRepository.findById = () => ({
    id: 'doc-1',
    owner: 'user-1',
    storagePath: '/storage/doc-1.txt',
  });
  fs.access = async () => {
    throw new Error('missing file');
  };

  await assert.rejects(
    () => documentService.downloadDocument('doc-1', 'user-1'),
    {
      name: 'DocumentServiceError',
      code: 'FILE_NOT_FOUND',
      message: 'O arquivo do documento não está disponível.',
      statusCode: 404,
    },
  );
});

test('downloadDocument retorna o documento quando o arquivo existe', async () => {
  const document = {
    id: 'doc-1',
    owner: 'user-1',
    storagePath: '/storage/doc-1.txt',
  };

  documentRepository.findById = () => document;
  fs.access = async () => {};

  const result = await documentService.downloadDocument('doc-1', 'user-1');

  assert.strictEqual(result, document);
});
