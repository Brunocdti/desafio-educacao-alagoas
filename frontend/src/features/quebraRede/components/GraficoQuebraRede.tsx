import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../../components/Card';
import { CHART } from '../../../lib/chartTheme';
import { formatarNumero, formatarPercentual } from '../../../lib/formatters';
import { useFiltrosDisponiveis } from '../../filtros/hooks/useFiltrosDisponiveis';
import { useQuebraPorRede, type ItemQuebraRede } from '../hooks/useQuebraPorRede';

const ehPercentual = (variavel: string) => variavel.startsWith('Taxa de');

function formatarValor(variavel: string, valor: number): string {
  return ehPercentual(variavel) ? formatarPercentual(valor) : formatarNumero(valor);
}

function TooltipRede({
  active,
  payload,
  variavel,
}: {
  active?: boolean;
  payload?: { payload: ItemQuebraRede }[];
  variavel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  if (item.valor === null) return null;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-slate-900">{formatarValor(variavel, item.valor)}</p>
      <p className="text-slate-500">{item.rede}</p>
    </div>
  );
}

export function GraficoQuebraRede() {
  const { data: filtros } = useFiltrosDisponiveis();
  const [variavel, setVariavel] = useState('Matrícula');
  const { dados, isLoading, isError } = useQuebraPorRede(variavel);

  const comDado = dados.filter((d) => d.valor !== null);
  const semDado = dados.filter((d) => d.valor === null).map((d) => d.rede);

  return (
    <Card
      title="Quebra por rede de ensino"
      subtitle="Estadual, Municipal, Federal e Privada — nunca somadas ao Total/Pública."
    >
      <div className="mb-3">
        <label className="text-sm font-medium text-slate-900" htmlFor="rede-variavel">
          Variável:{' '}
        </label>
        <select
          id="rede-variavel"
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

      {isLoading && <p className="text-sm text-slate-400">Carregando quebra por rede…</p>}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar a quebra por rede.</p>}

      {!isLoading && !isError && comDado.length === 0 && (
        <p className="text-sm text-slate-500">
          Sem dado para <strong>{variavel}</strong> no recorte selecionado, em nenhuma rede.
        </p>
      )}

      {comDado.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comDado} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="rede"
                stroke={CHART.axis}
                tick={{ fill: CHART.textPrimary, fontSize: 12 }}
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
              <Tooltip
                content={<TooltipRede variavel={variavel} />}
                cursor={{ fill: '#f1f5f9' }}
                isAnimationActive={false}
              />
              <Bar dataKey="valor" fill={CHART.accent} radius={[4, 4, 0, 0]} maxBarSize={64}>
                <LabelList
                  dataKey="valor"
                  position="top"
                  formatter={(v: unknown) => formatarValor(variavel, Number(v))}
                  fill={CHART.textPrimary}
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {semDado.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Sem dado para {semDado.join(', ')} no recorte selecionado.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
