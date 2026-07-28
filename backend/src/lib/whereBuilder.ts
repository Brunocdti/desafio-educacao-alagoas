import { Prisma } from '@prisma/client';

export function filtroMunicipios(coMuns?: string[]): Prisma.Sql {
  if (!coMuns || coMuns.length === 0) return Prisma.empty;
  return Prisma.sql`AND m.co_mun IN (${Prisma.join(coMuns)})`;
}

export function filtroAnoIntervalo(anoInicio?: number, anoFim?: number): Prisma.Sql {
  const partes: Prisma.Sql[] = [];
  if (anoInicio !== undefined) partes.push(Prisma.sql`AND m.ano >= ${anoInicio}`);
  if (anoFim !== undefined) partes.push(Prisma.sql`AND m.ano <= ${anoFim}`);
  return partes.length > 0 ? Prisma.join(partes, ' ') : Prisma.empty;
}

export function filtroAno(ano?: number): Prisma.Sql {
  return ano !== undefined ? Prisma.sql`AND m.ano = ${ano}` : Prisma.empty;
}

export function filtroRede(rede?: string): Prisma.Sql {
  return rede ? Prisma.sql`AND m.ensino_rede = ${rede}` : Prisma.empty;
}

export function filtroEtapa(etapa?: string): Prisma.Sql {
  return etapa ? Prisma.sql`AND m.ensino_tipo = ${etapa}` : Prisma.empty;
}
