import { getDownloadUrl } from '../services/documentApi';

// Link de download direto para o arquivo armazenado no backend.
export default function DownloadButton({ documentId, fileName }) {
  return (
    <a href={getDownloadUrl(documentId)} download={fileName}>
      Baixar
    </a>
  );
}
