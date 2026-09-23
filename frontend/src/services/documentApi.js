// Cliente de API para o backend do DMS, consumido via prefixo /api (proxy do Vite).

const API_BASE_URL = '/api';

async function parseErrorMessage(response) {
  try {
    const body = await response.json();
    return body?.error?.message || 'Ocorreu um erro ao comunicar com o servidor.';
  } catch {
    return 'Ocorreu um erro ao comunicar com o servidor.';
  }
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
}

export async function listDocuments() {
  const response = await fetch(`${API_BASE_URL}/documents`);

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const { documents } = await response.json();
  return documents;
}

export function getDownloadUrl(documentId) {
  return `${API_BASE_URL}/documents/${documentId}/download`;
}
