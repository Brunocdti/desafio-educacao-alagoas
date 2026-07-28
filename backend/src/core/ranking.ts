import { FiltroBase } from '../lib/filtroQuery';

export interface ItemRanking {
  coMun: string;
  municipio: string;
  valor: number;
}

export interface ParametrosRanking extends FiltroBase {
  ano: number;
  limite: number;
}

export interface RankingStore {
  obterRanking(variavel: string, params: ParametrosRanking): Promise<ItemRanking[]>;
}
