import { FiltrosBar } from '../features/filtros/components/FiltrosBar';
import { UploadForm } from '../features/upload/components/UploadForm';
import { CardsIndicadores } from '../features/indicadores/components/CardsIndicadores';
import { GraficoSerie } from '../features/series/components/GraficoSerie';
import { GraficoRanking } from '../features/ranking/components/GraficoRanking';
import { GraficoQuebraRede } from '../features/quebraRede/components/GraficoQuebraRede';
import { TabelaDados } from '../features/dados/components/TabelaDados';

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
        <GraficoSerie />
        <GraficoRanking />
        <GraficoQuebraRede />
        <TabelaDados />
      </div>
    </main>
  );
}
