const MASTER_MACHINE_LIST = [
  "Tubemill 16/22", "Tubemill 27",
  "Core 27.1", "Core 27.2", "Core 16.1", "Core 16.2",
  "Core 16.3", "Core Cds 01", "Core Cds 02", "Core Cds 3",
  "Core Atoc", "Crav.1", "Crav.2", "Crav.3",
  "ESA1", "ESA2"
];

const dataInput = document.getElementById('dataInput');
const horaSelect = document.getElementById('horaSelect');
const btnCarregarForm = document.getElementById('btnCarregarForm');
const formContainer = document.getElementById('formContainer');
const mediasContainer = document.getElementById('mediasContainer');
const botoesContainer = document.getElementById('botoesContainer');
const formTitulo = document.getElementById('formTitulo');
const tituloData = document.getElementById('tituloData');
const tituloHora = document.getElementById('tituloHora');
const btnGerarArquivo = document.getElementById('btnGerarArquivo');
const feedback = document.getElementById('feedback');

let historicoCompletoCache = [];
let novosDados = {};

window.addEventListener('DOMContentLoaded', carregarDadosIniciais);

function carregarDadosIniciais() {
  let relatoriosCombinados = [];

  if (typeof dadosProdutivosOut25 !== "undefined" && dadosProdutivosOut25.relatorios) {
    relatoriosCombinados = relatoriosCombinados.concat(dadosProdutivosOut25.relatorios);
  }
  if (typeof dadosProdutivosNov25 !== "undefined" && dadosProdutivosNov25.relatorios) {
    relatoriosCombinados = relatoriosCombinados.concat(dadosProdutivosNov25.relatorios);
  }

  const dadosUnicos = new Map(
    relatoriosCombinados.map((relatorio) => [relatorio.data, relatorio])
  ).values();
  historicoCompletoCache = [...dadosUnicos];
  console.log(`Dados iniciais carregados: ${historicoCompletoCache.length} relatórios.`);
}

dataInput.valueAsDate = new Date();

btnCarregarForm.addEventListener('click', carregarFormulario);
btnGerarArquivo.addEventListener('click', gerarArquivo);

// ===================== CARREGAR FORMULÁRIO =====================
async function carregarFormulario() {
  const dataSelecionada = formatarData(dataInput.value);
  const horaSelecionada = horaSelect.value;

  if (!dataInput.value || !horaSelecionada) {
    exibirFeedback('Por favor, selecione uma data e um horário.', 'error');
    return;
  }

  exibirFeedback('', '');
  formContainer.innerHTML = '';
  mostrarLoading(true);

  tituloData.textContent = dataSelecionada;
  tituloHora.textContent = horaSelecionada;
  formTitulo.style.display = 'block';

  await new Promise(res => setTimeout(res, 300));

  MASTER_MACHINE_LIST.forEach(nomeMaquina => {
    const preenchimento = getPreenchimento(nomeMaquina, horaSelecionada);

    const card = document.createElement('div');
    card.className = 'maquina-card';
    card.dataset.maquinaNome = nomeMaquina;

    card.innerHTML = `
      <h3>${nomeMaquina}</h3>
      <div>
        <label for="obj-${nomeMaquina}">Obj:</label>
        <input type="number" class="input-obj" value="${preenchimento.obj}">
      </div>
      <div>
        <label for="real-${nomeMaquina}">Real:</label>
        <input type="number" class="input-real" value="0">
      </div>
      <div>
        <label for="perc-${nomeMaquina}">%:</label>
        <input type="text" class="input-perc" value="0.00%" disabled>
      </div>
      <div>
        <label for="obs-${nomeMaquina}">Obs:</label>
        <input type="text" class="input-obs" value="${preenchimento.obs}">
      </div>
    `;
    formContainer.appendChild(card);
  });

  formContainer.querySelectorAll('.input-obj, .input-real').forEach(input => {
    input.addEventListener('input', autoCalcularPercentual);
  });

  mediasContainer.style.display = 'grid';
  botoesContainer.style.display = 'flex';

  document.getElementById('mediaTubemill').disabled = true;
  document.getElementById('mediaCore').disabled = true;
  document.getElementById('mediaCravacao').disabled = true;
  document.getElementById('mediaEsa').disabled = true;
  document.getElementById('mediaGeral').disabled = true;

  calcularMediasGlobais(); 
  mostrarLoading(false);
}

function getPreenchimento(nomeMaquina, hora) {
  let obj = 0;
  let obs = '';

  if (!historicoCompletoCache || historicoCompletoCache.length === 0) {
    return { obj, obs };
  }

  for (const relatorio of historicoCompletoCache) {
    const horarioEncontrado = relatorio.horarios.find(h => h.hora === hora);
    if (horarioEncontrado) {
      const maquinaEncontrada = horarioEncontrado.maquinas.find(m => m.nome === nomeMaquina);
      if (maquinaEncontrada) {

        const objPadrao = maquinaEncontrada.obj || 0;

        return { 
          obj: objPadrao,
          obs: '' 
        };
      }
    }
  }
  return { obj, obs };
}

function autoCalcularPercentual(event) {
  const card = event.target.closest('.maquina-card');
  const objInput = card.querySelector('.input-obj');
  const realInput = card.querySelector('.input-real');
  const percInput = card.querySelector('.input-perc');

  const obj = parseFloat(objInput.value) || 0;
  const real = parseFloat(realInput.value) || 0;

  let percentual = 0;
  if (obj > 0) {
    percentual = (real / obj) * 100;
  }

  percInput.value = percentual.toFixed(2) + '%';
  calcularMediasGlobais();
}

function calcularMediasGlobais() {
  const cards = formContainer.querySelectorAll('.maquina-card');
  if (cards.length === 0) return;

  let setores = {
    tubemill: { soma: 0, count: 0 },
    core: { soma: 0, count: 0 },
    cravacao: { soma: 0, count: 0 },
    esa: { soma: 0, count: 0 }
  };
  let geral = { soma: 0, count: 0 };

  for (const card of cards) {
    const nome = card.dataset.maquinaNome;
    const percString = card.querySelector('.input-perc').value || '0.00%';
    const percentual = parseFloat(percString.replace('%', '')) || 0;
    const obj = parseFloat(card.querySelector('.input-obj').value) || 0;

    if (obj > 0) {
      geral.soma += percentual;
      geral.count++;

      if (nome.startsWith('Tubemill')) {
        setores.tubemill.soma += percentual;
        setores.tubemill.count++;
      } else if (nome.startsWith('Core')) {
        setores.core.soma += percentual;
        setores.core.count++;
      } else if (nome.startsWith('Crav.')) {
        setores.cravacao.soma += percentual;
        setores.cravacao.count++;
      } else if (nome.startsWith('ESA')) {
        setores.esa.soma += percentual;
        setores.esa.count++;
      }
    }
  }

  const mediaTubemill = (setores.tubemill.count > 0) ? (setores.tubemill.soma / setores.tubemill.count) : 0;
  const mediaCore = (setores.core.count > 0) ? (setores.core.soma / setores.core.count) : 0;
  const mediaCravacao = (setores.cravacao.count > 0) ? (setores.cravacao.soma / setores.cravacao.count) : 0;
  const mediaEsa = (setores.esa.count > 0) ? (setores.esa.soma / setores.esa.count) : 0;
  const mediaGeral = (geral.count > 0) ? (geral.soma / geral.count) : 0;

  document.getElementById('mediaTubemill').value = mediaTubemill.toFixed(1);
  document.getElementById('mediaCore').value = mediaCore.toFixed(1);
  document.getElementById('mediaCravacao').value = mediaCravacao.toFixed(1);
  document.getElementById('mediaEsa').value = mediaEsa.toFixed(1);
  document.getElementById('mediaGeral').value = mediaGeral.toFixed(1);
}

// ===================== GERAR ARQUIVO =====================
async function gerarArquivo() {
  const rawData = dataInput.value;
  const hora = horaSelect.value;

  if (!rawData || !hora) {
    exibirFeedback('Por favor, selecione uma data e um horário antes de gerar o arquivo.', 'error');
    return;
  }

  const data = formatarData(rawData);

  const maquinas = [];
  const cards = formContainer.querySelectorAll('.maquina-card');
  if (cards.length === 0) {
    exibirFeedback('Nenhum formulário carregado.', 'error');
    return;
  }
  for (const card of cards) {
    const nome = card.dataset.maquinaNome;
    const obj = parseFloat(card.querySelector('.input-obj').value) || 0;
    const real = parseFloat(card.querySelector('.input-real').value) || 0;
    const percentual = obj > 0 ? Number(((real / obj) * 100).toFixed(2)) : 0;
    const obsRaw = card.querySelector('.input-obs').value.trim();
    const obs = obsRaw !== '' ? obsRaw : '—';
    maquinas.push({ nome, obj, real, percentual, obs });
  }
  const medias = {
    tubemill: parseFloat(document.getElementById('mediaTubemill').value) || 0,
    core: parseFloat(document.getElementById('mediaCore').value) || 0,
    cravacao: parseFloat(document.getElementById('mediaCravacao').value) || 0,
    esa: parseFloat(document.getElementById('mediaEsa').value) || 0,
    geral: parseFloat(document.getElementById('mediaGeral').value) || 0,
  };
  const novoHorario = { hora, maquinas, medias };

  novosDados[data] = novosDados[data] || { data, horarios: [] };
  const idx = novosDados[data].horarios.findIndex(h => h.hora === hora);
  if (idx > -1) novosDados[data].horarios[idx] = novoHorario;
  else novosDados[data].horarios.push(novoHorario);

  let historicoCompleto = JSON.parse(JSON.stringify(historicoCompletoCache));

  const ordemHorarios = ["09:00", "11:00", "13:00"];

  Object.values(novosDados).forEach(novoRelatorio => {
    const dataNova = novoRelatorio.data;
    const idxExistente = historicoCompleto.findIndex(r => r.data === dataNova);

    if (idxExistente > -1) {
      novoRelatorio.horarios.forEach(novoHorario => {
        const hIdx = historicoCompleto[idxExistente].horarios.findIndex(h => h.hora === novoHorario.hora);
        if (hIdx > -1) historicoCompleto[idxExistente].horarios[hIdx] = novoHorario;
        else historicoCompleto[idxExistente].horarios.push(novoHorario);
      });
      historicoCompleto[idxExistente].horarios.sort((a, b) =>
        ordemHorarios.indexOf(a.hora) - ordemHorarios.indexOf(b.hora)
      );
    } else {
      novoRelatorio.horarios.sort((a, b) =>
        ordemHorarios.indexOf(a.hora) - ordemHorarios.indexOf(b.hora)
      );
      historicoCompleto.push(novoRelatorio);
    }
  });

  historicoCompleto.sort((a, b) => {
    const dataA = a.data.split('/').reverse().join('-');
    const dataB = b.data.split('/').reverse().join('-');
    return dataB.localeCompare(dataA);
  });

  const [dia, mes, ano] = data.split('/');
  
  const mesAbrev = new Date(ano, mes - 1, dia)
                     .toLocaleString('pt-BR', { month: 'short' })
                     .replace('.', '');
  
  const nomeVariavel = `dadosProdutivos${mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1)}${ano.slice(-2)}`;
  
  const nomeArquivo = `data-${mesAbrev}-${ano}.js`;

  const relatoriosDoMes = historicoCompleto.filter(relatorio => {
      const [rDia, rMes, rAno] = relatorio.data.split('/');
      return rMes === mes && rAno === ano;
  });

  const dadosFinais = { relatorios: relatoriosDoMes };
  const conteudoFinal = `const ${nomeVariavel} = ${JSON.stringify(dadosFinais, null, 2)};`;

  try {
    const blob = new Blob([conteudoFinal], { type: 'text/javascript;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    exibirFeedback(`✅ Sucesso! "${nomeArquivo}" foi gerado e baixado.`, 'success');
    
    historicoCompletoCache = historicoCompleto; 
    novosDados = {};
    limparFormularios();

  } catch (e) {
    exibirFeedback('❌ Erro ao gerar o arquivo: ' + e.message, 'error');
  }
}


// ===================== LOADING =====================
function mostrarLoading(ativo) {
  let overlay = document.getElementById("loadingOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loadingOverlay";
    overlay.innerHTML = `
      <div class="spinner"></div>
      <p>Carregando formulário...</p>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = ativo ? "flex" : "none";
}

// ===================== UTILITÁRIAS =====================
function limparFormularios() {
  formContainer.innerHTML = '';
  formTitulo.style.display = 'none';
  mediasContainer.style.display = 'none';
  botoesContainer.style.display = 'none';
  document.getElementById('mediaTubemill').value = '';
  document.getElementById('mediaCore').value = '';
  document.getElementById('mediaCravacao').value = '';
  document.getElementById('mediaEsa').value = '';
  document.getElementById('mediaGeral').value = '';
  horaSelect.value = '';
  dataInput.valueAsDate = new Date();
}

function formatarData(dataString) {
  if (!dataString) return '';
  const [ano, mes, dia] = dataString.split('-');
  return `${dia}/${mes}/${ano}`;
}

function exibirFeedback(mensagem, tipo) {
  feedback.textContent = mensagem;
  feedback.className = tipo;
}