export interface MunicipioFiltro {
  coMun: string;
  noMun: string;
}

export interface FiltrosDisponiveis {
  municipios: MunicipioFiltro[];
  anos: number[];
  redes: string[];
  etapas: string[];
  variaveis: string[];
}

export interface FiltrosStore {
  obterFiltros(): Promise<FiltrosDisponiveis>;
}
