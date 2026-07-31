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
  /** Só calculada com etapa fixada — sem isso, `Escolas` conta ofertas, não escolas de verdade. */
  mediaAlunosPorEscola: number | null;
  /** Participação da rede Privada no total de matrículas — ignora o filtro de rede do recorte, é sempre Privada/Total. */
  participacaoRedePrivada: number | null;
  observacao?: string;
}

export interface IndicadoresStore {
  obterIndicadores(filtro: FiltroBase): Promise<Indicadores>;
}
