export interface ItemEvolucao {
  coMun: string;
  noMun: string;
  valorInicio: number;
  valorFim: number;
  diferenca: number;
  /** null quando valorInicio é 0 — variação percentual não é calculável. */
  percentual: number | null;
}

export interface ParamsEvolucao {
  municipio?: string[];
  rede?: string;
  etapa?: string;
  anoInicio: number;
  anoFim: number;
  limite: number;
}

export interface EvolucaoStore {
  obterEvolucao(variavel: string, params: ParamsEvolucao): Promise<ItemEvolucao[]>;
}
