/**
 * filters.js — Filtros Avançados e Busca (Finance Control System)
 *
 * ✅ ISOLADO: Este arquivo não modifica app.js.
 *    Ele lê o array global `historico` e o elemento da tabela de relatórios.
 *
 * DEPENDÊNCIAS (devem existir antes deste script ser carregado):
 *   - Array global: `historico`  (definido em app.js)
 *   - Elemento HTML: `<tbody id="relatorio-tbody">`
 *   - Elemento HTML: `<span id="relatorio-total">`
 *   - Elementos de filtro: #filtro-nome, #filtro-categoria, #filtro-mes
 *
 * COMO INTEGRAR:
 *   No index.html, adicione APÓS o <script src="app.js">:
 *   <script src="filters.js"></script>
 */

// ─────────────────────────────────────────────
//  FUNÇÕES PURAS DE FILTRAGEM (exportadas para testes)
// ─────────────────────────────────────────────

/**
 * Filtra gastos pelo nome (parcial, case-insensitive).
 * @param {Array} lista - Array de gastos
 * @param {string} termo - Texto a buscar no campo "nome"
 * @returns {Array}
 */
function filtrarPorNome(lista, termo) {
  if (!termo || termo.trim() === '') return lista;
  const termoBusca = termo.trim().toLowerCase();
  return lista.filter(item =>
    item.nome && item.nome.toLowerCase().includes(termoBusca)
  );
}

/**
 * Filtra gastos por categoria/classe.
 * @param {Array} lista - Array de gastos
 * @param {string} categoria - Categoria exata (ou "" para todas)
 * @returns {Array}
 */
function filtrarPorCategoria(lista, categoria) {
  if (!categoria || categoria === '') return lista;
  return lista.filter(item => item.classe === categoria);
}

/**
 * Filtra gastos por mês/ano (formato "YYYY-MM").
 * @param {Array} lista - Array de gastos
 * @param {string} mesAno - Mês no formato "YYYY-MM" (ou "" para todos)
 * @returns {Array}
 */
function filtrarPorMes(lista, mesAno) {
  if (!mesAno || mesAno === '') return lista;
  return lista.filter(item => {
    if (!item.data) return false;
    // Suporta datas no formato "YYYY-MM-DD" ou "YYYY-MM"
    return item.data.startsWith(mesAno);
  });
}

/**
 * Aplica todos os filtros em cadeia.
 * @param {Array} lista
 * @param {{ nome: string, categoria: string, mes: string }} filtros
 * @returns {Array}
 */
function aplicarFiltros(lista, filtros) {
  let resultado = lista;
  resultado = filtrarPorNome(resultado, filtros.nome);
  resultado = filtrarPorCategoria(resultado, filtros.categoria);
  resultado = filtrarPorMes(resultado, filtros.mes);
  return resultado;
}

// ─────────────────────────────────────────────
//  RENDERIZAÇÃO DA TABELA FILTRADA
// ─────────────────────────────────────────────

/**
 * Renderiza a tabela de relatórios com base nos filtros ativos.
 * Se renderRelatorio() já existir no app.js, esta função a sobrescreve
 * apenas para a aba de relatórios filtrada; o comportamento original
 * do app.js não é afetado fora da aba.
 */
function renderRelatorioFiltrado() {
  const tbody = document.getElementById('relatorio-tbody');
  const totalEl = document.getElementById('relatorio-total');

  if (!tbody) {
    console.warn('[filters.js] Elemento #relatorio-tbody não encontrado.');
    return;
  }

  // Lê os valores dos filtros
  const filtros = {
    nome:      (document.getElementById('filtro-nome')?.value      || ''),
    categoria: (document.getElementById('filtro-categoria')?.value || ''),
    mes:       (document.getElementById('filtro-mes')?.value       || ''),
  };

  // historico é o array global do app.js
  const lista = typeof historico !== 'undefined' ? historico : [];
  const filtrados = aplicarFiltros(lista, filtros);

  // Limpa e re-renderiza
  tbody.innerHTML = '';

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="filtro-vazio">
          <span class="filtro-vazio-icone">◈</span>
          Nenhum gasto encontrado
        </td>
      </tr>`;
    if (totalEl) totalEl.textContent = 'R$ 0,00';
    return;
  }

  let total = 0;
  filtrados.forEach(item => {
    const valor = parseFloat(item.valor) || 0;
    total += valor;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nome || '—'}</td>
      <td>${item.classe || '—'}</td>
      <td>${formatarData(item.data)}</td>
      <td class="valor-cell">R$ ${valor.toFixed(2).replace('.', ',')}</td>
    `;
    tbody.appendChild(tr);
  });

  if (totalEl) {
    totalEl.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
  }
}

/**
 * Formata "YYYY-MM-DD" → "DD/MM/YYYY".
 */
function formatarData(data) {
  if (!data) return '—';
  const partes = data.split('-');
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return data;
}

// ─────────────────────────────────────────────
//  POPULAÇÃO DINÂMICA DO SELECT DE CATEGORIAS
// ─────────────────────────────────────────────

function popularCategorias() {
  const select = document.getElementById('filtro-categoria');
  if (!select) return;

  const lista = typeof historico !== 'undefined' ? historico : [];
  const categorias = [...new Set(lista.map(i => i.classe).filter(Boolean))].sort();

  // Remove opções antigas (exceto a primeira — "Todas")
  while (select.options.length > 1) select.remove(1);

  categorias.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

// ─────────────────────────────────────────────
//  INICIALIZAÇÃO DOS EVENT LISTENERS
// ─────────────────────────────────────────────

function inicializarFiltros() {
  const filtroNome = document.getElementById('filtro-nome');
  const filtroCategoria = document.getElementById('filtro-categoria');
  const filtroMes = document.getElementById('filtro-mes');
  const btnLimpar = document.getElementById('filtros-limpar');

  if (filtroNome)      filtroNome.addEventListener('input', renderRelatorioFiltrado);
  if (filtroCategoria) filtroCategoria.addEventListener('change', renderRelatorioFiltrado);
  if (filtroMes)       filtroMes.addEventListener('change', renderRelatorioFiltrado);

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      if (filtroNome)      filtroNome.value = '';
      if (filtroCategoria) filtroCategoria.value = '';
      if (filtroMes)       filtroMes.value = '';
      renderRelatorioFiltrado();
    });
  }

  // Renderização inicial ao carregar a página
  popularCategorias();
  renderRelatorioFiltrado();
}

// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarFiltros);
} else {
  inicializarFiltros();
}

// ─────────────────────────────────────────────
//  EXPORTAÇÕES (para os testes Jest)
// ─────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    filtrarPorNome,
    filtrarPorCategoria,
    filtrarPorMes,
    aplicarFiltros,
  };
}
