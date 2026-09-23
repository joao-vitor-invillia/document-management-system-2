import { useCallback, useEffect, useState } from 'react';
import { listDocuments } from './documentApi';

// Hook compartilhado para carregar e recarregar a lista de documentos.
export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await listDocuments();
      setDocuments(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { documents, isLoading, error, reload };
}
