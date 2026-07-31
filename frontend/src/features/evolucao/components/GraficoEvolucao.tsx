import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../../../components/Card';
import { CHART } from '../../../lib/chartTheme';
import { formatarNumero, formatarPercentual } from '../../../lib/formatters';
import { useFiltrosDisponiveis } from '../../filtros/hooks/useFiltrosDisponiveis';
import { useEvolucao } from '../hooks/useEvolucao';
import type { ItemEvolucao } from '../types';

const ehPercentual = (variavel: string) => variavel.startsWith('Taxa de');

// Mesma variação também usada no backend (lib/dominio.ts `aumentoEBom`) — cair é bom
// só pra essas três, o resto é aumento é bom.
const QUEDA_BOA = new Set(['Taxa de Reprovação', 'Taxa de Abandono', 'Taxa de Analfabetismo']);
const aumentoEBom = (variavel: string) => !QUEDA_BOA.has(variavel);

function formatarValor(variavel: string, valor: number): string {
  return ehPercentual(variavel) ? formatarPercentual(valor) : formatarNumero(valor);
}

// Métrica usada pra barra/ordenação: variável já percentual compara em pontos (diferença);
// variável absoluta compara em variação percentual, senão município grande sempre domina
// só por ter números maiores (mesmo motivo de não fazer média simples entre municípios de
// porte diferente).
function metrica(item: ItemEvolucao, variavel: string): number {
  return ehPercentual(variavel) ? item.diferenca : (item.percentual ?? item.diferenca);
}

function TooltipEvolucao({
  active,
  payload,
  variavel,
}: {
  active?: boolean;
  payload?: { payload: ItemEvolucao & { metrica: number } }[];
  variavel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-slate-900">{item.noMun}</p>
      <p className="text-slate-500">
        {formatarValor(variavel, item.valorInicio)} → {formatarValor(variavel, item.valorFim)}
      </p>
      <p className="text-slate-500">
        {ehPercentual(variavel)
          ? `${item.diferenca >= 0 ? '+' : ''}${item.diferenca.toFixed(1)} pontos`
          : item.percentual !== null
            ? `${item.percentual >= 0 ? '+' : ''}${item.percentual.toFixed(1)}%`
            : 'variação não calculável'}
      </p>
    </div>
  );
}

export function GraficoEvolucao() {
  const { data: filtros } = useFiltrosDisponiveis();
  const [variavel, setVariavel] = useState('Matrícula');
  const [anoInicio, setAnoInicio] = useState<number | undefined>(undefined);
  const [anoFim, setAnoFim] = useState<number | undefined>(undefined);

  const anos = filtros?.anos ?? [];
  const anoInicioEfetivo = anoInicio ?? anos[0];
  const anoFimEfetivo = anoFim ?? anos[anos.length - 1];

  const { data, isLoading, isError } = useEvolucao(variavel, anoInicioEfetivo, anoFimEfetivo, 10);
  const favoravel = aumentoEBom(variavel);

  const dados = (data ?? [])
    .map((item) => ({ ...item, metrica: metrica(item, variavel) }))
    .sort((a, b) => (favoravel ? b.metrica - a.metrica : a.metrica - b.metrica));

  return (
    <Card
      title="Ranking de evolução"
      subtitle="Quem mais melhorou (ou piorou) entre dois anos — derivado só do CSV, sem fonte externa."
    >
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium text-slate-900" htmlFor="evolucao-variavel">
            Variável:{' '}
          </label>
          <select
            id="evolucao-variavel"
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
          <label className="text-sm font-medium text-slate-900" htmlFor="evolucao-ano-inicio">
            De:{' '}
          </label>
          <select
            id="evolucao-ano-inicio"
            className="rounded border border-slate-300 bg-white p-1 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            value={anoInicioEfetivo ?? ''}
            onChange={(e) => setAnoInicio(e.target.value ? Number(e.target.value) : undefined)}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900" htmlFor="evolucao-ano-fim">
            Para:{' '}
          </label>
          <select
            id="evolucao-ano-fim"
            className="rounded border border-slate-300 bg-white p-1 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            value={anoFimEfetivo ?? ''}
            onChange={(e) => setAnoFim(e.target.value ? Number(e.target.value) : undefined)}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {anoInicioEfetivo === anoFimEfetivo && (
        <p className="text-sm text-slate-500">Escolha dois anos diferentes para comparar.</p>
      )}
      {isLoading && anoInicioEfetivo !== anoFimEfetivo && (
        <p className="text-sm text-slate-400">Carregando evolução…</p>
      )}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar a evolução.</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">
          Sem município com dado nos dois anos para <strong>{variavel}</strong> no recorte selecionado.
        </p>
      )}

      {dados.length > 0 && (
        <ResponsiveContainer width="100%" height={Math.max(220, dados.length * 34)}>
          <BarChart data={dados} layout="vertical" margin={{ top: 8, right: 56, bottom: 0, left: 8 }}>
            <CartesianGrid stroke={CHART.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={CHART.axis}
              tick={{ fill: CHART.textMuted, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: CHART.axis }}
              tickFormatter={(v: number) => (ehPercentual(variavel) ? `${v.toFixed(0)}p` : `${v.toFixed(0)}%`)}
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
            <ReferenceLine x={0} stroke={CHART.axis} />
            <Tooltip
              content={<TooltipEvolucao variavel={variavel} />}
              cursor={{ fill: '#f1f5f9' }}
              isAnimationActive={false}
            />
            <Bar dataKey="metrica" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
              {dados.map((item) => (
                <Cell
                  key={item.coMun}
                  fill={(item.metrica >= 0) === favoravel ? CHART.good : CHART.critical}
                />
              ))}
              <LabelList
                dataKey="metrica"
                position="right"
                formatter={(v: unknown) =>
                  ehPercentual(variavel) ? `${Number(v).toFixed(1)}p` : `${Number(v).toFixed(1)}%`
                }
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
