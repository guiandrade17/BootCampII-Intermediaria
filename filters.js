/**
 * filters.js — Filtro Exclusivo por Categoria (Finance Control System)
 * ✅ CORRIGIDO: Intercepta e limpa a tabela corretamente sem conflito com o app.js!
 */

function filtrarRelatorioPorCategoria() {
  const seletorCategoria = document.getElementById('filtro-categoria');
  const categoriaSelecionada = seletorCategoria ? seletorCategoria.value : '';

  // 1. Pega os elementos da tabela nativos do teu app.js
  const tbody = document.getElementById('relatorio-tbody');
  const totalRel = document.getElementById('total-rel');
  const emptyState = document.getElementById('empty-relatorio');

  if (!tbody) return;

  // 2. LIMPA COMPLETAMENTE A TABELA ANTES DE FILTRAR (Evita acumular dados antigos!)
  tbody.innerHTML = '';
  let totalAcumulado = 0;

  // 3. Filtra os dados usando o array global 'historico' do teu app.js
  const dadosFiltrados = historico.filter(item => {
    if (!categoriaSelecionada || categoriaSelecionada === '') return true;
    return item.classe === categoriaSelecionada;
  });

  // 4. Se não houver gastos na categoria selecionada
  if (dadosFiltrados.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (totalRel) totalRel.textContent = 'R$ 0,00';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // 5. Desenha as linhas filtradas mantendo a estrutura exata do teu app.js
  dadosFiltrados.forEach(g => {
    const valorNum = parseFloat(g.valor) || 0;
    totalAcumulado += valorNum;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escHtml(g.nome)}</td>
      <td class="valor-cel">R$ ${formatVal(g.valor)}</td>
      <td><span class="tag-categoria">${escHtml(g.classe)}</span></td>
      <td>${escHtml(g.data)}</td>
      <td style="text-align: center;">
        <button class="btn-table-del" onclick="abrirModalRemover(${g.id}, '${escHtml(g.nome)}')">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 6. Atualiza o total acumulado na interface
  if (totalRel) {
    totalRel.textContent = `R$ ${formatVal(totalAcumulado)}`;
  }
}

// Inicializa os escutadores do select de filtro
function inicializarFiltros() {
  const filtroCategoria = document.getElementById('filtro-categoria');
  const btnLimpar = document.getElementById('filtros-limpar');

  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', filtrarRelatorioPorCategoria);
  }

  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      if (filtroCategoria) filtroCategoria.value = '';
      filtrarRelatorioPorCategoria();
    });
  }

  // Se o app.js atualizar o histórico de surpresa, o filtro adapta-se
  window.addEventListener('gastoAtualizado', filtrarRelatorioPorCategoria);
}

// Garante que o script roda no momento certo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarFiltros);
} else {
  inicializarFiltros();
}