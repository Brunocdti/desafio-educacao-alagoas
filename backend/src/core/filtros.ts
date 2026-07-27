import { prisma } from '../lib/prisma';

export async function obterFiltros() {
  const [municipios, anos, redes, etapas, variaveis] = await Promise.all([
    prisma.medida.findMany({
      distinct: ['coMun'],
      select: { coMun: true, noMun: true },
      orderBy: { noMun: 'asc' },
    }),
    prisma.medida.findMany({
      distinct: ['ano'],
      select: { ano: true },
      orderBy: { ano: 'asc' },
    }),
    prisma.medida.findMany({ distinct: ['ensinoRede'], select: { ensinoRede: true } }),
    prisma.medida.findMany({ distinct: ['ensinoTipo'], select: { ensinoTipo: true } }),
    prisma.medida.findMany({ distinct: ['variavel'], select: { variavel: true } }),
  ]);

  return {
    municipios: municipios.map((m) => ({ coMun: m.coMun, noMun: m.noMun })),
    anos: anos.map((a) => a.ano),
    redes: redes.map((r) => r.ensinoRede),
    etapas: etapas.map((e) => e.ensinoTipo),
    variaveis: variaveis.map((v) => v.variavel),
  };
}
