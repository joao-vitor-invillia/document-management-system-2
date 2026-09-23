import { useId, useState } from 'react';
import { uploadDocument } from '../services/documentApi';

// Formulário simples de envio de documento para o backend.
export default function UploadComponent({ onUploaded }) {
  const inputId = useId();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  function handleFileChange(event) {
    setSelectedFile(event.target.files[0] || null);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError('Selecione um arquivo antes de enviar.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      event.target.reset();
      onUploaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={inputId}>Enviar documento</label>
      <div>
        <input id={inputId} type="file" onChange={handleFileChange} />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
