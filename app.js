/* =====================================================
   FINANCE CONTROL SYSTEM — app.js
   Storage: Supabase (PostgreSQL)
   ===================================================== */

// ─── Configuração Supabase ────────────────────────────────────────────────
// Substitua os valores abaixo com os do seu projeto:
// Project Settings → API → Project URL e anon public key

const SUPABASE_URL  = 'https://dbljvtkfsemexvyyotjl.supabase.co';
const SUPABASE_ANON = 'sb_publishable_YT9HentLvdJFZEIx7sO5QQ_sg6KLtRj';
const TABELA        = 'gastos';

const headers = {
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
};

// ─── API Supabase (funções de acesso ao banco) ────────────────────────────

async function dbBuscarTodos() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABELA}?select=*&order=id.asc`,
    { headers }
  );
  if (!res.ok) throw new Error('Erro ao buscar gastos.');
  return res.json();
}

async function dbInserir(gasto) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABELA}`,
    {
      method:  'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body:    JSON.stringify(gasto),
    }
  );
  if (!res.ok) throw new Error('Erro ao cadastrar gasto.');
  const dados = await res.json();
  return dados[0]; // retorna o registro com id gerado pelo banco
}

async function dbRemover(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${TABELA}?id=eq.${id}`,
    { method: 'DELETE', headers }
  );
  if (!res.ok) throw new Error('Erro ao remover gasto.');
}

// ─── Estado global ────────────────────────────────────────────────────────

let historico = []; // espelho local do banco
let idRemover = null; // id do registro aguardando confirmação de remoção

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

async function salvarGasto() {
  const nome   = document.getElementById('inp-nome').value;
  const valor  = document.getElementById('inp-valor').value;
  const classe = document.getElementById('inp-classe').value;
  const data   = document.getElementById('inp-data').value;

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

  const novoGasto = {
    nome:   nome.trim(),
    valor:  parseFloat(parseFloat(valor).toFixed(2)),
    classe: classe.trim(),
    data:   dataBR,
  };

  setBloqueado(true);
  try {
    const registrado = await dbInserir(novoGasto);
    historico.push(registrado);
    atualizarStats();

    document.getElementById('inp-nome').value   = '';
    document.getElementById('inp-valor').value  = '';
    document.getElementById('inp-classe').value = '';
    document.getElementById('inp-data').value   = '';

    showToast(`✔ "${nome.trim()}" cadastrado com sucesso!`, 'success');
  } catch (err) {
    showToast('Erro ao salvar. Verifique sua conexão.', 'danger');
    console.error(err);
  } finally {
    setBloqueado(false);
  }
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

  cont.innerHTML = historico.map(g => `
    <div class="report-card">
      <div class="report-row">
        <div>
          <div class="report-name">${escHtml(g.nome)}</div>
          <div class="report-meta">${escHtml(g.classe)} &nbsp;·&nbsp; ${g.data}</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px">
          <span class="val-cell">R$ ${formatVal(Number(g.valor))}</span>
          <button class="btn-remove" onclick="abrirModal(${g.id}, '${escHtml(g.nome)}')">✕ Remover</button>
        </div>
      </div>
    </div>
  `).join('');
}

function abrirModal(id, nome) {
  idRemover = id;
  document.getElementById('modal-nome').textContent = nome;
  document.getElementById('modal-overlay').classList.add('open');
}

function fecharModal() {
  idRemover = null;
  document.getElementById('modal-overlay').classList.remove('open');
}

async function confirmarRemocao() {
  if (idRemover === null) return;

  const gasto = historico.find(g => g.id === idRemover);
  const nome  = gasto?.nome ?? '';

  setBloqueado(true);
  try {
    await dbRemover(idRemover);
    historico = historico.filter(g => g.id !== idRemover);
    fecharModal();
    renderListaRemover();
    atualizarStats();
    showToast(`✔ "${nome}" removido com sucesso!`, 'danger');
  } catch (err) {
    showToast('Erro ao remover. Verifique sua conexão.', 'danger');
    console.error(err);
    fecharModal();
  } finally {
    setBloqueado(false);
  }
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

  const total = historico.reduce((s, g) => s + Number(g.valor), 0);
  totVal.textContent = `R$ ${formatVal(total)}`;

  tbody.innerHTML = historico.map(g => `
    <tr>
      <td>${escHtml(g.nome)}</td>
      <td><span class="val-cell">R$ ${formatVal(Number(g.valor))}</span></td>
      <td><span class="tag-class">${escHtml(g.classe)}</span></td>
      <td style="color:var(--text-muted); font-size:13px;">${g.data}</td>
    </tr>
  `).join('');
}

// ─── Stats ────────────────────────────────────────────────────────────────

function atualizarStats() {
  const total  = historico.reduce((s, g) => s + Number(g.valor), 0);
  const maxVal = historico.length
    ? Math.max(...historico.map(g => Number(g.valor)))
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

// ─── Loading (bloqueia UI durante chamadas ao banco) ──────────────────────

function setBloqueado(estado) {
  document.querySelectorAll('button, input').forEach(el => {
    el.disabled = estado;
  });
  const btn = document.querySelector('.btn-primary');
  if (btn) btn.textContent = estado ? '⟳  Aguarde...' : '⬡   Cadastrar Gasto';
}

// ─── Toast ────────────────────────────────────────────────────────────────

let toastTimer;

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast' + (type ? ' ' + type : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ─── Utilitários ──────────────────────────────────────────────────────────

function formatVal(n) {
  return Number(n).toLocaleString('pt-BR', {
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

// ─── Event Listeners ──────────────────────────────────────────────────────

['inp-nome', 'inp-valor', 'inp-classe', 'inp-data'].forEach(id => {
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') salvarGasto();
  });
});

document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) fecharModal();
});

// ─── Inicialização ────────────────────────────────────────────────────────

async function init() {
  // Mostra loading nas stats enquanto carrega do banco
  ['stat-total', 'stat-max'].forEach(id => {
    document.getElementById(id).textContent = 'R$ ...';
  });
  document.getElementById('stat-count').textContent = '...';

  try {
    historico = await dbBuscarTodos();
    atualizarStats();
  } catch (err) {
    showToast('Erro ao carregar dados. Verifique sua conexão.', 'danger');
    console.error(err);
    atualizarStats();
  }
}

init();
