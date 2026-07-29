import { FiltrosBar } from '../features/filtros/components/FiltrosBar';
import { UploadForm } from '../features/upload/components/UploadForm';

export function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Educação Alagoas</h1>
      <p className="mt-1 text-gray-600">Dashboard em construção.</p>

      <div className="mt-6">
        <UploadForm />
      </div>

      <div className="mt-6">
        <FiltrosBar />
      </div>
    </main>
  );
}
