import { useState } from 'react';
import { useUpload } from '../hooks/useUpload';
import { ApiError } from '../../../lib/apiClient';

export function UploadForm() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const upload = useUpload();

  function enviar() {
    if (!arquivo) return;
    upload.mutate(arquivo);
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-medium text-gray-900">Upload do CSV</h2>
      <p className="mt-1 text-sm text-gray-600">
        Reenviar um arquivo substitui todos os dados importados anteriormente.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="text-sm text-gray-700 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-300"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={!arquivo || upload.isPending}
          className="rounded bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {upload.isPending ? 'Processando…' : 'Enviar'}
        </button>
      </div>

      {upload.isError && (
        <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">
          {upload.error instanceof ApiError ? upload.error.message : 'Falha ao enviar o arquivo.'}
        </p>
      )}

      {upload.isSuccess && (
        <div className="mt-3 rounded bg-green-50 p-3 text-sm text-green-800">
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
    </div>
  );
}
