import { parse } from 'csv-parse';
import { CABECALHO_ESPERADO } from './dominio';
import { AppError } from './errors';

const PARSE_OPTIONS = {
  bom: true,
  trim: true,
  skip_empty_lines: true,
  relax_column_count: true,
} as const;

/** Lê apenas a primeira linha do buffer para validar o cabeçalho antes de tocar no banco. */
export async function lerCabecalho(buffer: Buffer): Promise<string[]> {
  const parser = parse(buffer, PARSE_OPTIONS);
  for await (const record of parser as AsyncIterable<string[]>) {
    parser.destroy();
    return record;
  }
  throw new AppError('Arquivo CSV vazio: nenhuma linha encontrada, nem o cabeçalho.');
}

export function validarCabecalho(header: string[]): void {
  const esperado = CABECALHO_ESPERADO as readonly string[];
  const igual =
    header.length === esperado.length && header.every((col, i) => col.trim() === esperado[i]);
  if (!igual) {
    throw new AppError(
      `Cabeçalho inválido. Esperado: "${esperado.join(',')}". Recebido: "${header.join(',')}".`,
    );
  }
}

/** Gera as linhas de dados , numeradas a partir de 2. */
export async function* linhasDeDados(
  buffer: Buffer,
): AsyncGenerator<{ numeroLinha: number; registro: string[] }> {
  const parser = parse(buffer, PARSE_OPTIONS);
  let numeroLinha = 0;
  let primeira = true;
  for await (const registro of parser as AsyncIterable<string[]>) {
    numeroLinha++;
    if (primeira) {
      primeira = false;
      continue; // pula o cabeçalho, já validado separadamente
    }
    yield { numeroLinha, registro };
  }
}

export function zipHeaderRow(header: string[], record: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  header.forEach((col, i) => {
    obj[col.trim()] = record[i] ?? '';
  });
  return obj;
}
