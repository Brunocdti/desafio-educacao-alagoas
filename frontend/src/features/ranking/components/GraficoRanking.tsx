import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../../../components/Card';
import { CHART } from '../../../lib/chartTheme';
import { formatarNumero, formatarPercentual } from '../../../lib/formatters';
import { useFiltrosDisponiveis } from '../../filtros/hooks/useFiltrosDisponiveis';
import { useRanking } from '../hooks/useRanking';
import type { ItemRanking } from '../types';

const ehPercentual = (variavel: string) => variavel.startsWith('Taxa de');

function formatarValor(variavel: string, valor: number): string {
  return ehPercentual(variavel) ? formatarPercentual(valor) : formatarNumero(valor);
}

function TooltipRanking({
  active,
  payload,
  variavel,
}: {
  active?: boolean;
  payload?: { payload: ItemRanking }[];
  variavel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-slate-900">{formatarValor(variavel, item.valor)}</p>
      <p className="text-slate-500">{item.noMun}</p>
    </div>
  );
}

export function GraficoRanking() {
  const { data: filtros } = useFiltrosDisponiveis();
  const [variavel, setVariavel] = useState('Matrícula');
  const [ano, setAno] = useState<number | undefined>(undefined);

  const anoEfetivo = ano ?? filtros?.anos[filtros.anos.length - 1];
  const { data, isLoading, isError } = useRanking(variavel, anoEfetivo, 10);

  return (
    <Card title="Comparação entre municípios">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium text-slate-900" htmlFor="ranking-variavel">
            Variável:{' '}
          </label>
          <select
            id="ranking-variavel"
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
        <div>
          <label className="text-sm font-medium text-slate-900" htmlFor="ranking-ano">
            Ano:{' '}
          </label>
          <select
            id="ranking-ano"
            className="rounded border border-slate-300 bg-white p-1 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            value={anoEfetivo ?? ''}
            onChange={(e) => setAno(e.target.value ? Number(e.target.value) : undefined)}
          >
            {(filtros?.anos ?? []).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Carregando ranking…</p>}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar o ranking.</p>}

      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">
          Sem dado para <strong>{variavel}</strong> em {anoEfetivo} no recorte selecionado.
        </p>
      )}

      {data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 48, bottom: 0, left: 8 }}
          >
            <CartesianGrid stroke={CHART.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={CHART.axis}
              tick={{ fill: CHART.textMuted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: CHART.axis }}
              tickFormatter={(v: number) => formatarValor(variavel, v)}
            />
            <YAxis
              type="category"
              dataKey="noMun"
              width={140}
              stroke={CHART.axis}
              tick={{ fill: CHART.textPrimary, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<TooltipRanking variavel={variavel} />}
              cursor={{ fill: '#f1f5f9' }}
              isAnimationActive={false}
            />
            <Bar dataKey="valor" fill={CHART.accent} radius={[0, 4, 4, 0]} maxBarSize={24}>
              <LabelList
                dataKey="valor"
                position="right"
                formatter={(v: unknown) => formatarValor(variavel, Number(v))}
                fill={CHART.textPrimary}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
