const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const documentRepository = require('../src/repositories/document.repository');

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
