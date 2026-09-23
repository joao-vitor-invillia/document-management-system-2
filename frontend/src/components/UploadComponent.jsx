import { useId, useState } from 'react';
import { uploadDocument } from '../services/documentApi';

// Formulário simples de envio de documento para o backend.
const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg', 'image/gif'];
const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.gif'];

export default function UploadComponent({ onUploaded }) {
  const inputId = useId();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  function validateFile(file) {
    if (!file) {
      return 'Selecione um arquivo antes de enviar.';
    }

    const fileName = file.name.toLowerCase();
    const extension = fileName.slice(fileName.lastIndexOf('.'));
    const isAllowedExtension = allowedExtensions.includes(extension);
    const isAllowedType = allowedTypes.includes(file.type) || isAllowedExtension;

    if (!isAllowedType) {
      return 'Tipo de arquivo não permitido. Use PDF, DOC, DOCX, TXT, PNG, JPG, JPEG ou GIF.';
    }

    return null;
  }

  function handleFileChange(event) {
    const file = event.target.files[0] || null;
    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
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
