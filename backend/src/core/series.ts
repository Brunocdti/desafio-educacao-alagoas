import { FiltroBase } from '../lib/filtroQuery';

export interface PontoSerie {
  ano: number;
  valor: number;
}

export interface ResultadoSerie {
  pontos: PontoSerie[];
  observacao?: string;
}

export interface SeriesStore {
  obterSerie(variavel: string, filtro: FiltroBase): Promise<ResultadoSerie>;
}
