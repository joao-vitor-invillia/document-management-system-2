const { after, before, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const http = require('node:http');
const app = require('../src/app');
const documentRepository = require('../src/repositories/document.repository');

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

async function cleanupDocument(documentId) {
  const document = documentRepository.findById(documentId);

  if (!document) {
    return;
  }

  await fs.rm(document.storagePath, { force: true });
  documentRepository.remove(documentId);
}

async function uploadTestDocument({ owner, originalName = 'documento.txt', content = 'conteudo de teste' }) {
  const formData = new FormData();
  formData.append('file', new Blob([content], { type: 'text/plain' }), originalName);

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      'x-user-id': owner,
    },
    body: formData,
  });

  const body = await response.json();

  assert.strictEqual(response.status, 201);
  return body;
}

// Teste de fumaça do seed: garante que o app Express foi exportado.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('deve rejeitar caminhos fora do diretório de armazenamento', () => {
  assert.throws(() => documentRepository.resolveStoragePath('../../etc/passwd'), /fora do diretório/i);
  assert.doesNotThrow(() => documentRepository.resolveStoragePath('arquivo.pdf'));
});

test('deve aceitar apenas tipos de arquivo permitidos', () => {
  assert.strictEqual(documentRepository.isAllowedFileType({ originalname: 'documento.pdf', mimetype: 'application/pdf' }), true);
  assert.strictEqual(documentRepository.isAllowedFileType({ originalname: 'arquivo.exe', mimetype: 'application/x-msdownload' }), false);
  assert.strictEqual(documentRepository.isAllowedFileType({ originalname: 'arquivo.txt', mimetype: 'text/plain' }), true);
});

test('POST /upload deve registrar um documento enviado', async () => {
  const document = await uploadTestDocument({
    owner: 'usuario-upload',
    originalName: 'relatorio.txt',
    content: 'arquivo enviado pelo teste de upload',
  });

  try {
    assert.ok(document.id);
    assert.strictEqual(document.originalName, 'relatorio.txt');
    assert.strictEqual(document.owner, 'usuario-upload');
    assert.strictEqual(document.size, 36);
    assert.ok(document.uploadedAt);
    assert.strictEqual(document.storagePath, undefined);
  } finally {
    await cleanupDocument(document.id);
  }
});

test('GET /documents deve listar apenas documentos do usuario autenticado', async () => {
  const firstDocument = await uploadTestDocument({
    owner: 'usuario-listagem',
    originalName: 'primeiro.txt',
  });
  const secondDocument = await uploadTestDocument({
    owner: 'usuario-listagem',
    originalName: 'segundo.txt',
  });
  const otherUserDocument = await uploadTestDocument({
    owner: 'outro-usuario',
    originalName: 'privado.txt',
  });

  try {
    const response = await fetch(`${baseUrl}/documents`, {
      headers: {
        'x-user-id': 'usuario-listagem',
      },
    });
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.deepStrictEqual(
      body.documents.map((document) => document.id).sort(),
      [firstDocument.id, secondDocument.id].sort(),
    );
    assert.ok(body.documents.every((document) => document.owner === 'usuario-listagem'));
  } finally {
    await cleanupDocument(firstDocument.id);
    await cleanupDocument(secondDocument.id);
    await cleanupDocument(otherUserDocument.id);
  }
});

test('GET /documents/:id/download deve baixar o conteudo do documento', async () => {
  const content = 'conteudo disponivel para download';
  const document = await uploadTestDocument({
    owner: 'usuario-download',
    originalName: 'download.txt',
    content,
  });

  try {
    const response = await fetch(`${baseUrl}/documents/${document.id}/download`, {
      headers: {
        'x-user-id': 'usuario-download',
      },
    });

    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /download\.txt/);
    assert.strictEqual(await response.text(), content);
  } finally {
    await cleanupDocument(document.id);
  }
});
