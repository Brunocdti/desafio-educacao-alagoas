import { useState } from 'react';
import { Card } from '../../../components/Card';
import { useUpload } from '../hooks/useUpload';
import { ApiError } from '../../../lib/apiClient';
import { arquivoCsvSchema } from '../lib/arquivoSchema';

export function UploadForm() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const upload = useUpload();

  function selecionarArquivo(selecionado: File | null) {
    if (!selecionado) {
      setArquivo(null);
      setErroValidacao(null);
      return;
    }
    const resultado = arquivoCsvSchema.safeParse(selecionado);
    if (!resultado.success) {
      setArquivo(null);
      setErroValidacao(resultado.error.issues[0].message);
      return;
    }
    setArquivo(resultado.data);
    setErroValidacao(null);
  }

  function enviar() {
    if (!arquivo) return;
    upload.mutate(arquivo);
  }

  return (
    <Card
      title="Upload do CSV"
      subtitle="Reenviar um arquivo substitui todos os dados importados anteriormente."
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => selecionarArquivo(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={!arquivo || upload.isPending}
          className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {upload.isPending ? 'Processando…' : 'Enviar'}
        </button>
      </div>

      {erroValidacao && (
        <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{erroValidacao}</p>
      )}

      {upload.isError && (
        <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
          {upload.error instanceof ApiError ? upload.error.message : 'Falha ao enviar o arquivo.'}
        </p>
      )}

      {upload.isSuccess && (
        <div className="mt-3 rounded bg-emerald-50 p-3 text-sm text-slate-900">
          <p>
            <strong>{upload.data.linhasLidas}</strong> linhas lidas,{' '}
            <strong>{upload.data.linhasImportadas}</strong> importadas,{' '}
            <strong>{upload.data.linhasRejeitadas}</strong> rejeitadas.
          </p>
          {upload.data.erros.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-red-700">
              {upload.data.erros.map((e, i) => (
                <li key={i}>
                  {e.linha >= 0 ? `Linha ${e.linha}: ` : ''}
                  {e.motivo}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
