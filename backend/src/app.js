// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const { router: documentRouter } = require('./routes/document.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(documentRouter);

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const isFileTooLarge = error.code === 'LIMIT_FILE_SIZE';
    const isMultipleFiles = error.code === 'LIMIT_UNEXPECTED_FILE';
    const statusCode = isFileTooLarge ? 413 : 400;
    const code = isFileTooLarge
      ? 'FILE_TOO_LARGE'
      : isMultipleFiles
        ? 'SINGLE_FILE_ONLY'
        : 'UPLOAD_ERROR';

    return res.status(statusCode).json({
      error: {
        code,
        message: isFileTooLarge
          ? 'O arquivo excede o tamanho máximo permitido.'
          : 'Não foi possível processar o upload.',
      },
    });
  }

  if (error && error.message === 'FILE_TYPE_NOT_ALLOWED') {
    return res.status(415).json({
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Tipo de arquivo não permitido. Use PDF, DOC, DOCX, TXT, PNG, JPG, JPEG ou GIF.',
      },
    });
  }

  if (error && error.message && /fora do diretório|invalido para upload|arquivo/i.test(error.message)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_FILE',
        message: error.message,
      },
    });
  }

  return next(error);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
