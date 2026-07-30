import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../../../components/Card';
import { CHART } from '../../../lib/chartTheme';
import { formatarNumero, formatarPercentual } from '../../../lib/formatters';
import { useFiltrosDisponiveis } from '../../filtros/hooks/useFiltrosDisponiveis';
import { useSerie } from '../hooks/useSerie';
import type { PontoSerie } from '../types';

const ehPercentual = (variavel: string) => variavel.startsWith('Taxa de');

function formatarValor(variavel: string, valor: number): string {
  return ehPercentual(variavel) ? formatarPercentual(valor) : formatarNumero(valor);
}

function TooltipSerie({
  active,
  payload,
  variavel,
}: {
  active?: boolean;
  payload?: { payload: PontoSerie }[];
  variavel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const ponto = payload[0].payload;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-slate-900">{formatarValor(variavel, ponto.valor)}</p>
      <p className="text-slate-500">{ponto.ano}</p>
    </div>
  );
}

export function GraficoSerie() {
  const { data: filtros } = useFiltrosDisponiveis();
  const [variavel, setVariavel] = useState('Matrícula');
  const { data, isLoading, isError } = useSerie(variavel);

  const ultimoPonto = data && data.pontos.length > 0 ? data.pontos[data.pontos.length - 1] : null;

  return (
    <Card title="Série temporal">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-sm font-medium text-slate-900" htmlFor="serie-variavel">
            Variável:{' '}
          </label>
          <select
            id="serie-variavel"
            className="rounded border border-slate-300 bg-white p-1 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            value={variavel}
            onChange={(e) => setVariavel(e.target.value)}
          >
            {(filtros?.variaveis ?? [variavel]).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {ultimoPonto && (
          <p className="text-sm text-slate-500">
            <span className="text-lg font-semibold text-slate-900">
              {formatarValor(variavel, ultimoPonto.valor)}
            </span>{' '}
            em {ultimoPonto.ano}
          </p>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-400">Carregando série…</p>}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar a série.</p>}

      {data && data.pontos.length === 0 && (
        <p className="text-sm text-slate-500">
          Sem dado para <strong>{variavel}</strong> no recorte selecionado.
        </p>
      )}

      {data && data.pontos.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.pontos} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="ano"
                stroke={CHART.axis}
                tick={{ fill: CHART.textMuted, fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: CHART.axis }}
              />
              <YAxis
                stroke={CHART.axis}
                tick={{ fill: CHART.textMuted, fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={64}
                tickFormatter={(v: number) => formatarValor(variavel, v)}
              />
              <Tooltip content={<TooltipSerie variavel={variavel} />} />
              <Line
                type="monotone"
                dataKey="valor"
                stroke={CHART.accent}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART.accent, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {data.observacao && <p className="mt-2 text-xs text-slate-400">{data.observacao}</p>}
        </>
      )}
    </Card>
  );
}
