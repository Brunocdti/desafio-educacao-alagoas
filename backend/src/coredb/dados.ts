import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { DadosStore, ItemDado } from '../core/dados';

/**
 * Diferente dos outros stores, aqui NÃO aplicamos `redeEfetiva`: esta é uma
 * listagem de linhas brutas (nenhuma soma acontece), então não existe risco de
 * contar a hierarquia de rede duas vezes — o usuário pode querer ver todas as
 * redes lado a lado na tabela.
 */
export const dadosStore: DadosStore = {
  async obterDados(params) {
    const where: Prisma.MedidaWhereInput = {
      ...(params.municipio ? { coMun: { in: params.municipio } } : {}),
      ...(params.rede ? { ensinoRede: params.rede } : {}),
      ...(params.etapa ? { ensinoTipo: params.etapa } : {}),
      ...(params.variavel ? { variavel: params.variavel } : {}),
      ...(params.anoInicio !== undefined || params.anoFim !== undefined
        ? {
            ano: {
              ...(params.anoInicio !== undefined ? { gte: params.anoInicio } : {}),
              ...(params.anoFim !== undefined ? { lte: params.anoFim } : {}),
            },
          }
        : {}),
    };

    const [total, linhas] = await Promise.all([
      prisma.medida.count({ where }),
      prisma.medida.findMany({
        where,
        orderBy: [{ ano: 'asc' }, { noMun: 'asc' }, { variavel: 'asc' }, { ensinoRede: 'asc' }],
        skip: (params.pagina - 1) * params.tamanho,
        take: params.tamanho,
      }),
    ]);

    const itens: ItemDado[] = linhas.map((l) => ({
      coMun: l.coMun,
      noMun: l.noMun,
      ano: l.ano,
      fonte: l.fonte,
      variavel: l.variavel,
      ensinoRede: l.ensinoRede,
      ensinoTipo: l.ensinoTipo,
      valor: l.valor.toNumber(),
    }));

    return { itens, total, pagina: params.pagina, tamanho: params.tamanho };
  },
};
