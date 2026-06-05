// ═══════════════════════════════════════════════════════════════
//  NOVOS TESTES — Filtros Avançados e Busca
//  Cole este bloco no final do arquivo app.tests.js existente.
// ═══════════════════════════════════════════════════════════════

const { filtrarPorNome, filtrarPorCategoria, filtrarPorMes, aplicarFiltros } = require('./filters');

// ─── Fixture compartilhada ───────────────────────────────────────
const mockHistorico = [
  { nome: 'Mercado Extra',    classe: 'Alimentação', data: '2025-06-05', valor: '250.00' },
  { nome: 'Netflix',          classe: 'Lazer',       data: '2025-06-10', valor: '55.90'  },
  { nome: 'Mercado Livre',    classe: 'Compras',     data: '2025-07-02', valor: '189.00' },
  { nome: 'Farmácia Popular', classe: 'Saúde',       data: '2025-07-15', valor: '40.00'  },
  { nome: 'iFood',            classe: 'Alimentação', data: '2025-08-01', valor: '78.50'  },
];

// ─── filtrarPorNome ───────────────────────────────────────────────
describe('filtrarPorNome', () => {
  test('retorna todos os itens quando o termo está vazio', () => {
    expect(filtrarPorNome(mockHistorico, '')).toHaveLength(5);
  });

  test('encontra gastos por busca parcial (case-insensitive)', () => {
    const resultado = filtrarPorNome(mockHistorico, 'mercado');
    expect(resultado).toHaveLength(2);
    expect(resultado.map(i => i.nome)).toEqual(['Mercado Extra', 'Mercado Livre']);
  });

  test('retorna array vazio quando nenhum item corresponde ao termo', () => {
    expect(filtrarPorNome(mockHistorico, 'zzz')).toHaveLength(0);
  });

  test('ignora espaços extras no início e fim do termo', () => {
    const resultado = filtrarPorNome(mockHistorico, '  netflix  ');
    expect(resultado).toHaveLength(1);
    expect(resultado[0].nome).toBe('Netflix');
  });
});

// ─── filtrarPorCategoria ──────────────────────────────────────────
describe('filtrarPorCategoria', () => {
  test('retorna todos os itens quando a categoria é vazia', () => {
    expect(filtrarPorCategoria(mockHistorico, '')).toHaveLength(5);
  });

  test('filtra corretamente por categoria existente', () => {
    const resultado = filtrarPorCategoria(mockHistorico, 'Alimentação');
    expect(resultado).toHaveLength(2);
    resultado.forEach(item => expect(item.classe).toBe('Alimentação'));
  });

  test('retorna array vazio para categoria inexistente', () => {
    expect(filtrarPorCategoria(mockHistorico, 'Transporte')).toHaveLength(0);
  });
});

// ─── filtrarPorMes ────────────────────────────────────────────────
describe('filtrarPorMes', () => {
  test('retorna todos os itens quando o mês está vazio', () => {
    expect(filtrarPorMes(mockHistorico, '')).toHaveLength(5);
  });

  test('retorna apenas os gastos do mês informado', () => {
    const resultado = filtrarPorMes(mockHistorico, '2025-06');
    expect(resultado).toHaveLength(2);
    resultado.forEach(item => expect(item.data).toMatch(/^2025-06/));
  });

  test('retorna array vazio para mês sem gastos', () => {
    expect(filtrarPorMes(mockHistorico, '2024-01')).toHaveLength(0);
  });
});

// ─── aplicarFiltros (combinação de filtros) ───────────────────────
describe('aplicarFiltros', () => {
  test('combina filtro de nome e mês corretamente', () => {
    const resultado = aplicarFiltros(mockHistorico, {
      nome: 'mercado',
      categoria: '',
      mes: '2025-06',
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].nome).toBe('Mercado Extra');
  });

  test('sem filtros ativos retorna todo o histórico', () => {
    const resultado = aplicarFiltros(mockHistorico, {
      nome: '', categoria: '', mes: '',
    });
    expect(resultado).toHaveLength(5);
  });

  test('combinação de categoria e mês sem resultados retorna []', () => {
    const resultado = aplicarFiltros(mockHistorico, {
      nome: '',
      categoria: 'Saúde',
      mes: '2025-06',
    });
    expect(resultado).toHaveLength(0);
  });

  test('total dos valores filtrados é calculável a partir do resultado', () => {
    const resultado = aplicarFiltros(mockHistorico, {
      nome: '', categoria: 'Alimentação', mes: '',
    });
    const total = resultado.reduce((acc, i) => acc + parseFloat(i.valor), 0);
    expect(total).toBeCloseTo(328.50);
  });
});
