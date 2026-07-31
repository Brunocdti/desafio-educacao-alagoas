export interface Indicadores {
  anoReferencia: number | null;
  totalMatriculas: number | null;
  totalEscolas: { valor: number | null; rotulo: 'escolas' | 'ofertas de ensino' };
  taxaAprovacaoMedia: { valor: number | null; metodo: string };
  taxaAbandonoMedia: { valor: number | null; metodo: string };
  variacaoMatriculasAnoAAno: {
    anoAnterior: number;
    valorAnterior: number;
    percentual: number;
  } | null;
  mediaAlunosPorEscola: number | null;
  participacaoRedePrivada: number | null;
  observacao?: string;
}
