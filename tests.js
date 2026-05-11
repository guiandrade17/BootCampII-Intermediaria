// Copie as funções do app.js aqui, ou use import/export
// (as mesmas que já existem no app.js)

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

// ── Testes de VALOR ──────────────────────────────────────
test('valor positivo deve funcionar',          () => expect(validarValor('100.50')).toBe(''));
test('valor negativo deve falhar',             () => expect(validarValor('-50.30')).not.toBe(''));
test('valor texto deve falhar',                () => expect(validarValor('cinquenta reais')).not.toBe(''));
test('valor caso limite positivo funciona',    () => expect(validarValor('0.0111')).toBe(''));
test('valor caso limite negativo falha',       () => expect(validarValor('-0.01')).not.toBe(''));
test('valor zero deve falhar',                 () => expect(validarValor('0.00')).not.toBe(''));

// ── Testes de NOME ───────────────────────────────────────
test('nome válido deve funcionar',             () => expect(validarNome('Aluguel do meu Filho')).toBe(''));
test('nome só números deve falhar',            () => expect(validarNome('1023994')).not.toBe(''));
test('nome vazio deve falhar',                 () => expect(validarNome('')).not.toBe(''));

// ── Testes de CLASSE ─────────────────────────────────────
test('classe somente letras funciona',         () => expect(validarClasse('Lazer')).toBe(''));
test('classe somente números falha',           () => expect(validarClasse('129343')).not.toBe(''));
test('classe híbrida funciona',                () => expect(validarClasse('Lazer 1')).toBe(''));