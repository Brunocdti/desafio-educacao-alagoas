import { FiltroBase } from '../lib/filtroQuery';

export interface Indicadores {
  anoReferencia: number | null;
  totalMatriculas: number | null;
  totalEscolas: { valor: number | null; rotulo: 'escolas' | 'ofertas de ensino' };
  taxaAprovacaoMedia: { valor: number | null; metodo: 'ponderada por matrícula' };
  taxaAbandonoMedia: { valor: number | null; metodo: 'ponderada por matrícula' };
  variacaoMatriculasAnoAAno: {
    anoAnterior: number;
    valorAnterior: number;
    percentual: number;
  } | null;
  observacao?: string;
}

export interface IndicadoresStore {
  obterIndicadores(filtro: FiltroBase): Promise<Indicadores>;
}
