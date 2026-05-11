/* =====================================================
   FINANCE CONTROL SYSTEM — app.js
   Lógica: storage, validação, cadastro, remoção,
           relatório, stats, views, toast, modal
   ===================================================== */

// ─── Storage (localStorage) ───────────────────────────────────────────────

const CHAVE = 'fcs_gastos';

function carregarDados() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch {
    return [];
  }
}

function salvarDados(lista) {
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

// Estado global
let historico      = carregarDados();
let indiceRemover  = null;

// ─── Validação ────────────────────────────────────────────────────────────

function validarNome(v) {
  if (!v || v.trim().length === 0) return 'Informe um nome válido.';
  if (/^\d+$/.test(v.trim()))      return 'O nome não pode ser apenas números.';
  return '';
}

function validarValor(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return 'Informe um número válido (ex: 50.30).';
  if (n <= 0)   return 'O valor precisa ser maior que zero.';
  return '';
}

function validarClasse(v) {
  if (!v || v.trim().length === 0) return 'Informe uma categoria válida.';
  if (/^\d+$/.test(v.trim()))      return 'A categoria não pode ser apenas números.';
  return '';
}

function validarData(v) {
  if (!v) return 'Selecione uma data.';
  return '';
}

function setError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// ─── Cadastro ─────────────────────────────────────────────────────────────

function salvarGasto() {
  const nome   = document.getElementById('inp-nome').value;
  const valor  = document.getElementById('inp-valor').value;
  const classe = document.getElementById('inp-classe').value;
  const data   = document.getElementById('inp-data').value;

  // Validar todos os campos
  const eNome   = validarNome(nome);
  const eValor  = validarValor(valor);
  const eClasse = validarClasse(classe);
  const eData   = validarData(data);

  setError('err-nome',   eNome);
  setError('err-valor',  eValor);
  setError('err-classe', eClasse);
  setError('err-data',   eData);

  if (eNome || eValor || eClasse || eData) return;

  // Converter data de YYYY-MM-DD para DD/MM/YYYY
  const [y, m, d] = data.split('-');
  const dataBR = `${d}/${m}/${y}`;

  historico.push({
    nome:   nome.trim(),
    valor:  parseFloat(parseFloat(valor).toFixed(2)),
    classe: classe.trim(),
    data:   dataBR,
  });

  salvarDados(historico);
  atualizarStats();

  // Limpar formulário
  document.getElementById('inp-nome').value   = '';
  document.getElementById('inp-valor').value  = '';
  document.getElementById('inp-classe').value = '';
  document.getElementById('inp-data').value   = '';

  showToast(`✔ "${nome.trim()}" cadastrado com sucesso!`, 'success');
}

// ─── Remoção ──────────────────────────────────────────────────────────────

function renderListaRemover() {
  const cont = document.getElementById('lista-remover');

  if (!historico.length) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⬡</div>
        <div class="empty-text">Nenhum gasto para remover</div>
      </div>`;
    return;
  }

  cont.innerHTML = historico.map((g, i) => `
    <div class="report-card">
      <div class="report-row">
        <div>
          <div class="report-name">${escHtml(g.nome)}</div>
          <div class="report-meta">${escHtml(g.classe)} &nbsp;·&nbsp; ${g.data}</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px">
          <span class="val-cell">R$ ${formatVal(g.valor)}</span>
          <button class="btn-remove" onclick="abrirModal(${i})">✕ Remover</button>
        </div>
      </div>
    </div>
  `).join('');
}

function abrirModal(i) {
  indiceRemover = i;
  document.getElementById('modal-nome').textContent = historico[i].nome;
  document.getElementById('modal-overlay').classList.add('open');
}

function fecharModal() {
  indiceRemover = null;
  document.getElementById('modal-overlay').classList.remove('open');
}

function confirmarRemocao() {
  if (indiceRemover === null) return;

  const nome = historico[indiceRemover].nome;
  historico.splice(indiceRemover, 1);
  salvarDados(historico);
  fecharModal();
  renderListaRemover();
  atualizarStats();
  showToast(`✔ "${nome}" removido com sucesso!`, 'danger');
}

// ─── Relatório ────────────────────────────────────────────────────────────

function renderRelatorio() {
  const tbody  = document.getElementById('tbody-relatorio');
  const empty  = document.getElementById('empty-relatorio');
  const totRow = document.getElementById('total-row-rel');
  const totVal = document.getElementById('total-rel');
  const tabela = document.getElementById('tabela-relatorio');

  if (!historico.length) {
    tbody.innerHTML      = '';
    tabela.style.display = 'none';
    totRow.style.display = 'none';
    empty.style.display  = 'block';
    return;
  }

  tabela.style.display = 'table';
  totRow.style.display = 'flex';
  empty.style.display  = 'none';

  const total      = historico.reduce((s, g) => s + g.valor, 0);
  totVal.textContent = `R$ ${formatVal(total)}`;

  tbody.innerHTML = historico.map(g => `
    <tr>
      <td>${escHtml(g.nome)}</td>
      <td><span class="val-cell">R$ ${formatVal(g.valor)}</span></td>
      <td><span class="tag-class">${escHtml(g.classe)}</span></td>
      <td style="color:var(--text-muted); font-size:13px;">${g.data}</td>
    </tr>
  `).join('');
}

// ─── Stats (barra superior) ───────────────────────────────────────────────

function atualizarStats() {
  const total  = historico.reduce((s, g) => s + g.valor, 0);
  const maxVal = historico.length
    ? Math.max(...historico.map(g => g.valor))
    : 0;

  document.getElementById('stat-total').textContent = `R$ ${formatVal(total)}`;
  document.getElementById('stat-count').textContent = historico.length;
  document.getElementById('stat-max').textContent   = `R$ ${formatVal(maxVal)}`;
}

// ─── Navegação entre views ────────────────────────────────────────────────

function showView(view, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  document.getElementById('view-' + view).classList.add('active');
  btn.classList.add('active');

  if (view === 'remover')   renderListaRemover();
  if (view === 'relatorio') renderRelatorio();
}

// ─── Toast ────────────────────────────────────────────────────────────────

let toastTimer;

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast' + (type ? ' ' + type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── Utilitários ─────────────────────────────────────────────────────────

function formatVal(n) {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Event Listeners ─────────────────────────────────────────────────────

// Enter em qualquer campo do formulário dispara o cadastro
['inp-nome', 'inp-valor', 'inp-classe', 'inp-data'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') salvarGasto();
  });
});

// Fechar modal clicando no overlay
document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) fecharModal();
});

// ─── Inicialização ────────────────────────────────────────────────────────

atualizarStats();
