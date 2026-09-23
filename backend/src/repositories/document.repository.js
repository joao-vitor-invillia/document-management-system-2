const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const documents = new Map();

fs.mkdirSync(storageDirectory, { recursive: true });

function toPublicMetadata(document) {
  const { storageName, storagePath, ...metadata } = document;
  return metadata;
}

function create(documentFile, owner) {
  const id = crypto.randomUUID();
  const metadata = {
    id,
    originalName: documentFile.originalname,
    size: documentFile.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: documentFile.filename,
    storagePath: path.resolve(documentFile.path),
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
};
