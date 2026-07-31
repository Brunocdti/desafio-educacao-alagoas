import { useMemo, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet';
import type { Feature, Geometry } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { Card } from '../../../components/Card';
import { calcularFaixas, corParaValor, COR_SEM_DADO } from '../../../lib/escalaCor';
import { formatarNumero, formatarPercentual } from '../../../lib/formatters';
import { useFiltrosDisponiveis } from '../../filtros/hooks/useFiltrosDisponiveis';
import { useRanking } from '../../ranking/hooks/useRanking';
import { useMalha } from '../hooks/useMalha';

const ehPercentual = (variavel: string) => variavel.startsWith('Taxa de');

function formatarValor(variavel: string, valor: number): string {
  return ehPercentual(variavel) ? formatarPercentual(valor) : formatarNumero(valor);
}

const CENTRO_ALAGOAS: [number, number] = [-9.57, -36.78];

export function MapaCoropletico() {
  const { data: filtros } = useFiltrosDisponiveis();
  const { data: malha, isLoading: carregandoMalha, isError: erroMalha } = useMalha();
  const [variavel, setVariavel] = useState('Matrícula');
  const [ano, setAno] = useState<number | undefined>(undefined);
  const anoEfetivo = ano ?? filtros?.anos[filtros.anos.length - 1];

  // limite alto o bastante pra cobrir todos os 102 municípios de Alagoas.
  const {
    data: valores,
    isLoading: carregandoValores,
    isPlaceholderData: valoresDesatualizados,
    isError: erroValores,
  } = useRanking(variavel, anoEfetivo, 150);

  const { porMunicipio, faixas } = useMemo(() => {
    const mapa = new Map<string, { noMun: string; valor: number }>();
    (valores ?? []).forEach((v) => mapa.set(v.coMun, { noMun: v.noMun, valor: v.valor }));
    const numeros = (valores ?? []).map((v) => v.valor);
    return { porMunicipio: mapa, faixas: calcularFaixas(numeros) };
  }, [valores]);

  const estiloFeature = (feature?: Feature<Geometry, { codarea: string }>): PathOptions => {
    const codigo = feature?.properties?.codarea;
    const item = codigo ? porMunicipio.get(codigo) : undefined;
    return {
      fillColor: corParaValor(item?.valor, faixas),
      fillOpacity: 0.85,
      color: '#ffffff',
      weight: 1,
    };
  };

  const aoCadaFeature = (feature: Feature<Geometry, { codarea: string }>, layer: Layer) => {
    const codigo = feature.properties?.codarea;
    const item = codigo ? porMunicipio.get(codigo) : undefined;
    const texto = item
      ? `<strong>${item.noMun}</strong><br/>${formatarValor(variavel, item.valor)}`
      : `<strong>Município ${codigo}</strong><br/>Sem dado`;
    layer.bindTooltip(texto, { sticky: true });
    layer.on('mouseover', (e: LeafletMouseEvent) => {
      (e.target as L.Path).setStyle({ fillOpacity: 1, weight: 2 });
    });
    layer.on('mouseout', (e: LeafletMouseEvent) => {
      (e.target as L.Path).setStyle({ fillOpacity: 0.85, weight: 1 });
    });
  };

  const carregando = carregandoMalha || carregandoValores || valoresDesatualizados;
  const erro = erroMalha || erroValores;

  return (
    <Card
      title="Mapa coroplético"
      subtitle="Quebras por quantil — cada faixa de cor tem aproximadamente o mesmo número de municípios."
    >
      <div className="mb-3">
        <label className="text-sm font-medium text-slate-900" htmlFor="mapa-variavel">
          Variável:{' '}
        </label>
        <select
          id="mapa-variavel"
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
        <label className="ml-4 text-sm font-medium text-slate-900" htmlFor="mapa-ano">
          Ano:{' '}
        </label>
        <select
          id="mapa-ano"
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

      {carregando && <p className="text-sm text-slate-400">Carregando mapa…</p>}
      {erro && (
        <p className="text-sm text-red-600">
          Não foi possível carregar o mapa. Os outros gráficos e a tabela continuam funcionando
          normalmente — o mapa é um extra que não deveria travar o resto do dashboard.
        </p>
      )}

      {!carregando && !erro && malha && (
        <>
          <div className="h-[420px] w-full overflow-hidden rounded border border-slate-200">
            <MapContainer center={CENTRO_ALAGOAS} zoom={7} className="h-full w-full" scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON
                key={`${variavel}-${anoEfetivo}`}
                data={malha as GeoJSON.FeatureCollection}
                style={estiloFeature as (feature?: GeoJSON.Feature) => PathOptions}
                onEachFeature={aoCadaFeature as (feature: GeoJSON.Feature, layer: Layer) => void}
              />
            </MapContainer>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {faixas.map((f, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: f.cor }} />
                {formatarValor(variavel, f.min)}–{formatarValor(variavel, f.max)}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: COR_SEM_DADO }}
              />
              Sem dado
            </span>
          </div>
        </>
      )}
    </Card>
  );
}
