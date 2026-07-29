import { create } from 'zustand';

export interface FiltrosState {
  /** Códigos IBGE selecionados; array vazio = "todos os municípios". */
  municipios: string[];
  anoInicio?: number;
  anoFim?: number;
  rede?: string;
  etapa?: string;
  setMunicipios: (municipios: string[]) => void;
  setAnoInicio: (ano: number | undefined) => void;
  setAnoFim: (ano: number | undefined) => void;
  setRede: (rede: string | undefined) => void;
  setEtapa: (etapa: string | undefined) => void;
}

export const useFiltrosStore = create<FiltrosState>((set) => ({
  municipios: [],
  anoInicio: undefined,
  anoFim: undefined,
  rede: undefined,
  etapa: undefined,
  setMunicipios: (municipios) => set({ municipios }),
  setAnoInicio: (anoInicio) => set({ anoInicio }),
  setAnoFim: (anoFim) => set({ anoFim }),
  setRede: (rede) => set({ rede }),
  setEtapa: (etapa) => set({ etapa }),
}));
