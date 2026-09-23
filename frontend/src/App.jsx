import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { useDocuments } from './services/useDocuments';

export default function App() {
  const { documents, isLoading, error, reload } = useDocuments();

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>
      <UploadComponent onUploaded={reload} />
      <DocumentList documents={documents} isLoading={isLoading} error={error} />
    </main>
  );
}
