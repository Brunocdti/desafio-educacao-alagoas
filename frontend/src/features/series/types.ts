export interface PontoSerie {
  ano: number;
  valor: number;
}

export interface ResultadoSerie {
  pontos: PontoSerie[];
  observacao?: string;
}
