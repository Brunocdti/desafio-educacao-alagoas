import { FiltrosBar } from '../features/filtros/components/FiltrosBar';
import { UploadForm } from '../features/upload/components/UploadForm';
import { CardsIndicadores } from '../features/indicadores/components/CardsIndicadores';

export function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Educação em Alagoas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dados públicos de educação dos municípios alagoanos (2007–2025)
          </p>
        </header>

        <UploadForm />
        <FiltrosBar />
        <CardsIndicadores />
      </div>
    </main>
  );
}
