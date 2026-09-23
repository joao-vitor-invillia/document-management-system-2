const path = require('node:path');
const documentService = require('../services/document.service');

function getOwner(request) {
  return request.get('x-user-id') || process.env.DEFAULT_OWNER || 'default-user';
}

function sendError(response, error) {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = statusCode === 500
    ? 'Ocorreu um erro interno ao processar a solicitação.'
    : error.message;

  response.status(statusCode).json({
    error: { code, message },
  });
}

async function upload(request, response) {
  try {
    const document = await documentService.uploadDocument(
      request.file,
      getOwner(request),
    );
    response.status(201).json(document);
  } catch (error) {
    sendError(response, error);
  }
}

function list(request, response) {
  try {
    const documents = documentService.listDocuments(getOwner(request));
    response.status(200).json({ documents });
  } catch (error) {
    sendError(response, error);
  }
}

async function download(request, response) {
  try {
    const document = await documentService.downloadDocument(
      request.params.id,
      getOwner(request),
    );

    response.download(
      document.storagePath,
      path.basename(document.originalName),
      (error) => {
        if (error && !response.headersSent) {
          sendError(response, error);
        }
      },
    );
  } catch (error) {
    sendError(response, error);
  }
}

module.exports = {
  upload,
  list,
  download,
};
