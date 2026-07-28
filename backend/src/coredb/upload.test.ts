import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { csvRowSchema, uploadStore } from './upload';

const CABECALHO = 'co_mun,no_mun,ano,fonte,variavel,ensino_rede,ensino_tipo,valor';

function csv(...linhas: string[]): Buffer {
  return Buffer.from([CABECALHO, ...linhas].join('\n'), 'utf8');
}

const LINHA_VALIDA =
  '2704302,Maceió,2023,censo_escolar,Matrícula,Total,Ensino Fundamental,109026.0';

beforeEach(async () => {
  await prisma.medida.deleteMany({});
});

afterAll(async () => {
  await prisma.medida.deleteMany({});
  await prisma.$disconnect();
});

describe('csvRowSchema', () => {
  it('aceita uma linha válida', () => {
    const resultado = csvRowSchema.safeParse({
      co_mun: '2704302',
      no_mun: 'Maceió',
      ano: '2023',
      fonte: 'censo_escolar',
      variavel: 'Matrícula',
      ensino_rede: 'Total',
      ensino_tipo: 'Ensino Fundamental',
      valor: '109026.0',
    });
    expect(resultado.success).toBe(true);
  });

  it('rejeita co_mun com menos de 7 dígitos', () => {
    const resultado = csvRowSchema.safeParse({
      co_mun: '270430',
      no_mun: 'Maceió',
      ano: '2023',
      fonte: 'censo_escolar',
      variavel: 'Matrícula',
      ensino_rede: 'Total',
      ensino_tipo: 'Ensino Fundamental',
      valor: '109026.0',
    });
    expect(resultado.success).toBe(false);
  });

  it('rejeita ano fora da faixa 2007-2025', () => {
    const resultado = csvRowSchema.safeParse({
      co_mun: '2704302',
      no_mun: 'Maceió',
      ano: '1999',
      fonte: 'censo_escolar',
      variavel: 'Matrícula',
      ensino_rede: 'Total',
      ensino_tipo: 'Ensino Fundamental',
      valor: '109026.0',
    });
    expect(resultado.success).toBe(false);
  });

  it('rejeita valor não numérico', () => {
    const resultado = csvRowSchema.safeParse({
      co_mun: '2704302',
      no_mun: 'Maceió',
      ano: '2023',
      fonte: 'censo_escolar',
      variavel: 'Matrícula',
      ensino_rede: 'Total',
      ensino_tipo: 'Ensino Fundamental',
      valor: 'abc',
    });
    expect(resultado.success).toBe(false);
  });

  it('rejeita variável que não pertence à fonte informada', () => {
    const resultado = csvRowSchema.safeParse({
      co_mun: '2704302',
      no_mun: 'Maceió',
      ano: '2023',
      fonte: 'censo_escolar',
      variavel: 'Taxa de Aprovação', // pertence a indicadores_rendimento, não a censo_escolar
      ensino_rede: 'Total',
      ensino_tipo: 'Ensino Fundamental',
      valor: '95.0',
    });
    expect(resultado.success).toBe(false);
  });

  it('rejeita percentual fora da faixa 0-100', () => {
    const resultado = csvRowSchema.safeParse({
      co_mun: '2704302',
      no_mun: 'Maceió',
      ano: '2023',
      fonte: 'indicadores_rendimento',
      variavel: 'Taxa de Aprovação',
      ensino_rede: 'Total',
      ensino_tipo: 'Ensino Fundamental',
      valor: '150',
    });
    expect(resultado.success).toBe(false);
  });

  it('rejeita campo vazio', () => {
    const resultado = csvRowSchema.safeParse({
      co_mun: '2704302',
      no_mun: '',
      ano: '2023',
      fonte: 'censo_escolar',
      variavel: 'Matrícula',
      ensino_rede: 'Total',
      ensino_tipo: 'Ensino Fundamental',
      valor: '109026.0',
    });
    expect(resultado.success).toBe(false);
  });
});

describe('uploadStore.processarUpload — os 5 casos da seção 3.1', () => {
  it('1) CSV correto e completo é importado', async () => {
    const resumo = await uploadStore.processarUpload(csv(LINHA_VALIDA));
    expect(resumo.linhasLidas).toBe(1);
    expect(resumo.linhasImportadas).toBe(1);
    expect(resumo.linhasRejeitadas).toBe(0);

    const total = await prisma.medida.count();
    expect(total).toBe(1);
  });

  it('2) CSV com uma coluna renomeada é rejeitado com 400 antes de tocar no banco', async () => {
    const cabecalhoErrado = Buffer.from(
      'co_mun,no_mun,ano,fonte,variavel,rede_ensino,ensino_tipo,valor\n' + LINHA_VALIDA,
      'utf8',
    );

    await expect(uploadStore.processarUpload(cabecalhoErrado)).rejects.toThrow(AppError);
    expect(await prisma.medida.count()).toBe(0);
  });

  it('3) CSV com cabeçalho certo e zero linhas de dados não é erro', async () => {
    const resumo = await uploadStore.processarUpload(Buffer.from(CABECALHO, 'utf8'));
    expect(resumo.linhasLidas).toBe(0);
    expect(resumo.linhasImportadas).toBe(0);
    expect(resumo.linhasRejeitadas).toBe(0);
  });

  it('4) arquivo .txt disfarçado de .csv é rejeitado na validação de cabeçalho', async () => {
    const textoQualquer = Buffer.from('isso aqui não é um csv\nsó um texto qualquer', 'utf8');
    await expect(uploadStore.processarUpload(textoQualquer)).rejects.toThrow(AppError);
  });

  it('5) reenviar o mesmo arquivo substitui os dados em vez de duplicar', async () => {
    await uploadStore.processarUpload(csv(LINHA_VALIDA));
    await uploadStore.processarUpload(csv(LINHA_VALIDA));

    const total = await prisma.medida.count();
    expect(total).toBe(1); // e não 2
  });

  it('conta e reporta linhas inválidas sem derrubar a importação inteira', async () => {
    const linhaInvalida =
      '2704302,Maceió,9999,censo_escolar,Matrícula,Total,Ensino Fundamental,109026.0';
    const resumo = await uploadStore.processarUpload(csv(LINHA_VALIDA, linhaInvalida));

    expect(resumo.linhasLidas).toBe(2);
    expect(resumo.linhasImportadas).toBe(1);
    expect(resumo.linhasRejeitadas).toBe(1);
    expect(resumo.erros).toHaveLength(1);
    expect(resumo.erros[0].motivo).toMatch(/faixa/);
  });
});
