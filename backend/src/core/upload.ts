export interface ResumoUpload {
  linhasLidas: number;
  linhasImportadas: number;
  linhasRejeitadas: number;
  erros: { linha: number; motivo: string }[];
}

export interface UploadStore {
  processarUpload(buffer: Buffer): Promise<ResumoUpload>;
}
