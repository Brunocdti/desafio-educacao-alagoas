export interface ItemDado {
  coMun: string;
  noMun: string;
  ano: number;
  fonte: string;
  variavel: string;
  ensinoRede: string;
  ensinoTipo: string;
  valor: number;
}

export interface PaginaDados {
  itens: ItemDado[];
  total: number;
  pagina: number;
  tamanho: number;
}
