// =====================================================
// FINANCE CONTROL SYSTEM — app.tests.js
// Cobre: validação de campos, autenticação e fluxo
// de gastos (cadastro, remoção, relatório, stats)
// =====================================================

// ─── Funções replicadas do app.js ────────────────────
// Qualquer alteração nas regras do app.js deve ser
// refletida aqui também.

function validarValor(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return 'erro';
  if (n <= 0)   return 'erro';
  return '';
}

function validarNome(v) {
  if (!v || v.trim().length === 0) return 'erro';
  if (/^\d+$/.test(v.trim()))      return 'erro';
  return '';
}

function validarClasse(v) {
  if (!v || v.trim().length === 0) return 'erro';
  if (/^\d+$/.test(v.trim()))      return 'erro';
  return '';
}

function validarData(v) {
  if (!v) return 'erro';
  return '';
}

function validarEmail(v) {
  if (!v || v.trim().length === 0) return 'erro';
  if (!v.includes('@'))            return 'erro';
  return '';
}

function validarSenha(v) {
  if (!v || v.length < 6) return 'erro';
  return '';
}

function validarConfirmaSenha(senha, confirma) {
  if (senha !== confirma) return 'erro';
  return '';
}

function formatVal(n) {
  return Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcularTotal(historico) {
  return historico.reduce((s, g) => s + Number(g.valor), 0);
}

function calcularMaior(historico) {
  if (!historico.length) return 0;
  return Math.max(...historico.map(g => Number(g.valor)));
}

function removerGasto(historico, id) {
  return historico.filter(g => g.id !== id);
}

// ═══════════════════════════════════════════════════════
// 1. VALIDAÇÃO DE VALOR
// ═══════════════════════════════════════════════════════

describe('Validação de Valor', () => {
  test('valor positivo deve funcionar',            () => expect(validarValor('100.50')).toBe(''));
  test('valor negativo deve falhar',               () => expect(validarValor('-50.30')).not.toBe(''));
  test('valor em texto deve falhar',               () => expect(validarValor('cinquenta reais')).not.toBe(''));
  test('valor caso limite positivo deve funcionar',() => expect(validarValor('0.0111')).toBe(''));
  test('valor caso limite negativo deve falhar',   () => expect(validarValor('-0.01')).not.toBe(''));
  test('valor zero deve falhar',                   () => expect(validarValor('0.00')).not.toBe(''));
  test('valor vazio deve falhar',                  () => expect(validarValor('')).not.toBe(''));
  test('valor com vírgula deve funcionar como 50', () => expect(validarValor('50,30')).toBe(''));
});

// ═══════════════════════════════════════════════════════
// 2. VALIDAÇÃO DE NOME
// ═══════════════════════════════════════════════════════

describe('Validação de Nome', () => {
  test('nome válido deve funcionar',         () => expect(validarNome('Aluguel do meu Filho')).toBe(''));
  test('nome só números deve falhar',        () => expect(validarNome('1023994')).not.toBe(''));
  test('nome vazio deve falhar',             () => expect(validarNome('')).not.toBe(''));
  test('nome com espaços apenas deve falhar',() => expect(validarNome('   ')).not.toBe(''));
  test('nome híbrido deve funcionar',        () => expect(validarNome('Conta 2')).toBe(''));
});

// ═══════════════════════════════════════════════════════
// 3. VALIDAÇÃO DE CLASSE
// ═══════════════════════════════════════════════════════

describe('Validação de Classe', () => {
  test('classe somente letras deve funcionar', () => expect(validarClasse('Lazer')).toBe(''));
  test('classe somente números deve falhar',   () => expect(validarClasse('129343')).not.toBe(''));
  test('classe híbrida deve funcionar',        () => expect(validarClasse('Lazer 1')).toBe(''));
  test('classe vazia deve falhar',             () => expect(validarClasse('')).not.toBe(''));
});

// ═══════════════════════════════════════════════════════
// 4. VALIDAÇÃO DE DATA
// ═══════════════════════════════════════════════════════

describe('Validação de Data', () => {
  test('data preenchida deve funcionar', () => expect(validarData('2025-01-15')).toBe(''));
  test('data vazia deve falhar',         () => expect(validarData('')).not.toBe(''));
  test('data undefined deve falhar',     () => expect(validarData(undefined)).not.toBe(''));
});

// ═══════════════════════════════════════════════════════
// 5. VALIDAÇÃO DE AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════

describe('Validação de E-mail', () => {
  test('e-mail válido deve funcionar',       () => expect(validarEmail('user@email.com')).toBe(''));
  test('e-mail sem @ deve falhar',           () => expect(validarEmail('useremail.com')).not.toBe(''));
  test('e-mail vazio deve falhar',           () => expect(validarEmail('')).not.toBe(''));
  test('e-mail só espaços deve falhar',      () => expect(validarEmail('   ')).not.toBe(''));
});

describe('Validação de Senha', () => {
  test('senha com 6+ caracteres deve funcionar', () => expect(validarSenha('abc123')).toBe(''));
  test('senha com menos de 6 deve falhar',       () => expect(validarSenha('abc')).not.toBe(''));
  test('senha vazia deve falhar',                () => expect(validarSenha('')).not.toBe(''));
  test('senha com exatamente 6 deve funcionar',  () => expect(validarSenha('123456')).toBe(''));
});

describe('Validação de Confirmação de Senha', () => {
  test('senhas iguais devem funcionar',     () => expect(validarConfirmaSenha('abc123', 'abc123')).toBe(''));
  test('senhas diferentes devem falhar',   () => expect(validarConfirmaSenha('abc123', 'xyz999')).not.toBe(''));
  test('confirma vazia deve falhar',       () => expect(validarConfirmaSenha('abc123', '')).not.toBe(''));
});

// ═══════════════════════════════════════════════════════
// 6. FLUXO DE GASTOS
// ═══════════════════════════════════════════════════════

describe('Cálculo de Total', () => {
  const historico = [
    { id: 1, nome: 'Arroz',  valor: 25.50, classe: 'Mercado', data: '01/05/2025' },
    { id: 2, nome: 'Cinema', valor: 40.00, classe: 'Lazer',   data: '02/05/2025' },
    { id: 3, nome: 'Conta',  valor: 150.0, classe: 'Contas',  data: '03/05/2025' },
  ];

  test('total de lista com itens deve ser correto', () => {
    expect(calcularTotal(historico)).toBeCloseTo(215.50);
  });

  test('total de lista vazia deve ser zero', () => {
    expect(calcularTotal([])).toBe(0);
  });

  test('maior gasto deve ser identificado corretamente', () => {
    expect(calcularMaior(historico)).toBe(150.0);
  });

  test('maior gasto de lista vazia deve ser zero', () => {
    expect(calcularMaior([])).toBe(0);
  });
});

describe('Remoção de Gasto', () => {
  const historico = [
    { id: 1, nome: 'Arroz',  valor: 25.50 },
    { id: 2, nome: 'Cinema', valor: 40.00 },
    { id: 3, nome: 'Conta',  valor: 150.0 },
  ];

  test('remover gasto existente deve reduzir a lista', () => {
    const resultado = removerGasto(historico, 2);
    expect(resultado.length).toBe(2);
  });

  test('gasto removido não deve estar na lista', () => {
    const resultado = removerGasto(historico, 2);
    expect(resultado.find(g => g.id === 2)).toBeUndefined();
  });

  test('remover id inexistente não deve alterar a lista', () => {
    const resultado = removerGasto(historico, 999);
    expect(resultado.length).toBe(3);
  });

  test('remover de lista vazia deve retornar lista vazia', () => {
    expect(removerGasto([], 1)).toEqual([]);
  });
});

describe('Formatação de Valores', () => {
  test('valor deve ser formatado em reais brasileiro', () => {
    expect(formatVal(1000)).toBe('1.000,00');
  });

  test('valor decimal deve ser formatado corretamente', () => {
    expect(formatVal(25.5)).toBe('25,50');
  });

  test('valor zero deve ser formatado corretamente', () => {
    expect(formatVal(0)).toBe('0,00');
  });
});
