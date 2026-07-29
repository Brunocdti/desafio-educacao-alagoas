export interface ErroLinha {
  linha: number;
  motivo: string;
}

export interface ResumoUpload {
  linhasLidas: number;
  linhasImportadas: number;
  linhasRejeitadas: number;
  erros: ErroLinha[];
}
