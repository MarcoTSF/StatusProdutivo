const ChartLib = window.Chart;

let dadosOrigem = [];

let chartGeralInstance = null;
let chartSetoresInstance = null;

let doughnutInstances = [];

// util
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
};

window.addEventListener("DOMContentLoaded", () => {
  carregarDados();

  const btn7 = document.getElementById("filtro7dias");
  const btn15 = document.getElementById("filtro15dias");
  const btn30 = document.getElementById("filtro30dias");
  const btnTodos = document.getElementById("filtroTodos");

  btn7.addEventListener("click", (e) => atualizarGraficos(7, e.currentTarget));
  btn15.addEventListener("click", (e) => atualizarGraficos(15, e.currentTarget));
  btn30.addEventListener("click", (e) => atualizarGraficos(30, e.currentTarget));
  btnTodos.addEventListener("click", (e) => atualizarGraficos(null, e.currentTarget));

  const btnPadrao = btn30 || btnTodos;
  atualizarGraficos(btn30 ? 30 : null, btnPadrao);

  initPainelDiario();
});

function carregarDados() {
  let relatoriosCombinados = [];

  if (typeof dadosProdutivosOut25 !== "undefined" && dadosProdutivosOut25.relatorios) {
    relatoriosCombinados = relatoriosCombinados.concat(dadosProdutivosOut25.relatorios);
  }

  if (typeof dadosProdutivosNov25 !== "undefined" && dadosProdutivosNov25.relatorios) {
    relatoriosCombinados = relatoriosCombinados.concat(dadosProdutivosNov25.relatorios);
  }

  const mapa = new Map();
  relatoriosCombinados.forEach((r) => {
    mapa.set(r.data, r);
  });
  relatoriosCombinados = [...mapa.values()];

  relatoriosCombinados.sort((a, b) => parseDate(a.data) - parseDate(b.data));

  dadosOrigem = relatoriosCombinados;
  console.log("Dados brutos combinados:", dadosOrigem);
}

function atualizarGraficos(dias, elementoBotao) {
  document.querySelectorAll(".filtros-container button").forEach((btn) => btn.classList.remove("ativo"));
  if (elementoBotao) elementoBotao.classList.add("ativo");

  let dadosFiltrados = [];
  if (dias === null) dadosFiltrados = [...dadosOrigem];
  else dadosFiltrados = dadosOrigem.slice(-dias);

  gerarGraficoEvolucaoGeral(dadosFiltrados);
  gerarGraficoComparativoSetores(dadosFiltrados);

  popularDataSelect();
}

function gerarGraficoEvolucaoGeral(dadosParaExibir) {
  if (chartGeralInstance) chartGeralInstance.destroy();

  const ctx = document.getElementById("graficoGeral").getContext("2d");
  if (!dadosParaExibir.length) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  const labels = dadosParaExibir.map((r) => r.data);
  const dados = dadosParaExibir.map((r) => {
    const ultimoHorario = r.horarios[r.horarios.length - 1];
    return ultimoHorario?.medias?.geral || 0;
  });

  chartGeralInstance = new ChartLib(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Média Geral (%)",
          data: dados,
          borderColor: "#4E79A7",
          backgroundColor: "rgba(78, 121, 167, 0.2)",
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          pointBackgroundColor: "#4E79A7",
        },
        {
          label: "Meta (85%)",
          data: labels.map(() => 85),
          type: "line",
          borderColor: "#59A14F",
          borderWidth: 2,
          borderDash: [10, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: 0,
          backgroundColor: "rgba(89, 161, 79, 0.2)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 100 },
      },
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Evolução da Média Geral" },
      },
    },
  });
}

function gerarGraficoComparativoSetores(dadosParaExibir) {
  if (chartSetoresInstance) chartSetoresInstance.destroy();

  const ctx = document.getElementById("graficoSetores").getContext("2d");
  if (!dadosParaExibir.length) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  const labels = dadosParaExibir.map((r) => r.data);
  const setores = ["Tubemill", "Core", "Cravação", "ESA"];
  const setorKeys = ["tubemill", "core", "cravacao", "esa"];
  const cores = ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2"];

  const datasets = setores.map((setor, i) => ({
    label: setor,
    data: dadosParaExibir.map((r) => {
      const ultimoHorario = r.horarios[r.horarios.length - 1];
      const key = setorKeys[i];
      return ultimoHorario?.medias?.[key] || 0;
    }),
    backgroundColor: cores[i],
  }));

  chartSetoresInstance = new ChartLib(ctx, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { position: "top" }, title: { display: true, text: "Comparativo de Áreas (%)" } },
    },
  });
}

function initPainelDiario() {
  popularDataSelect();

  const dataSelect = document.getElementById("dataSelect");
  dataSelect.addEventListener("change", gerarResultadosDiarios);

  document.getElementById("tabsSetores").addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-setor]");
    if (!btn) return;
    document.querySelectorAll("#tabsSetores button").forEach((b) => b.classList.remove("ativo"));
    btn.classList.add("ativo");
    gerarResultadosDiarios();
  });

  setTimeout(() => {
    const ds = document.getElementById("dataSelect");
    if (ds && ds.options.length > 1) {
      ds.value = ds.options[1].value; 
      gerarResultadosDiarios();
    } else {
      gerarResultadosDiarios();
    }
  }, 200);
}
function popularDataSelect() {
  const select = document.getElementById("dataSelect");
  if (!select) return;

  select.innerHTML = "";
  const optPadrao = document.createElement("option");
  optPadrao.value = "";
  optPadrao.textContent = "Selecione data";
  select.appendChild(optPadrao);

  if (!dadosOrigem || !dadosOrigem.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "Nenhuma data disponível";
    select.appendChild(opt);
    return;
  }

  const copia = [...dadosOrigem].sort((a, b) => parseDate(b.data) - parseDate(a.data));
  copia.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.data;
    opt.textContent = r.data;
    select.appendChild(opt);
  });

  if (copia.length) select.value = copia[0].data;
}

function gerarResultadosDiarios() {
  doughnutInstances.forEach((d) => d.destroy());
  doughnutInstances = [];

  const dataSel = document.getElementById("dataSelect").value;
  const setorAtivo = document.querySelector("#tabsSetores button.ativo")?.dataset?.setor || "tubemill";
  const container = document.getElementById("containerResultados");
  container.innerHTML = "";

  if (!dataSel) {
    container.innerHTML = `<p style="color:var(--text-muted)">Selecione uma data para visualizar os resultados.</p>`;
    return;
  }

  const relatorio = dadosOrigem.find((r) => r.data === dataSel);
  if (!relatorio) {
    container.innerHTML = `<p style="color:var(--feedback-error)">Data selecionada não encontrada.</p>`;
    return;
  }

  const ultimoHorario = relatorio.horarios[relatorio.horarios.length - 1];
  const horaSelecionada = ultimoHorario.hora;

  const MASTER = [
    "Tubemill 16/22", "Tubemill 27",
    "Core 27.1", "Core 27.2", "Core 16.1", "Core 16.2", "Core 16.3",
    "Core Cds 01", "Core Cds 02", "Core Cds 3", "Core Atoc",
    "Crav.1", "Crav.2", "Crav.3",
    "ESA1", "ESA2"
  ];

  const setorMap = {
    tubemill: (name) => name.toLowerCase().startsWith("tubemill"),
    core: (name) => name.toLowerCase().startsWith("core"),
    cravacao: (name) => name.toLowerCase().startsWith("crav"),
    esa: (name) => name.toLowerCase().startsWith("esa"),
  };

  const maquinasDoSetor = MASTER.filter((m) => setorMap[setorAtivo](m));

  maquinasDoSetor.forEach((maquinaNome) => {
    const card = document.createElement("div");
    card.className = "maquina-result";

    const titulo = document.createElement("h3");
    titulo.textContent = maquinaNome;
    card.appendChild(titulo);

    const badge = document.createElement("div");
    badge.style =
      "margin-bottom: 10px; font-weight: 700; color: var(--color-primary-dark); font-size: 0.9rem;";
    badge.className = "hora-badge";
    badge.textContent = `Última hora de relatório: ${horaSelecionada}`;
    card.appendChild(badge);

    const maquinaObj = ultimoHorario.maquinas.find((m) => m.nome === maquinaNome);
    const obj = maquinaObj?.obj || 0;
    const real = maquinaObj?.real || 0;

    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 220;

    canvas.style.display = "block";
    canvas.style.margin = "10px auto";
    canvas.style.maxWidth = "100%";

    card.appendChild(canvas);

    criarDoughnutSimples(canvas, obj, real);

    const obsDiv = document.createElement("div");
    obsDiv.className = "legend";
    obsDiv.innerHTML = `<strong>OBS:</strong> ${maquinaObj?.obs?.trim() || "—"}`;
    card.appendChild(obsDiv);

    container.appendChild(card);
  });
}

function criarDoughnutSimples(canvas, obj, real) {
  const ctx = (canvas.getContext) ? canvas.getContext("2d") : null;
  if (!ctx) return;

  let data, colors, labels;

  if (obj <= 0) {
    data = [1];
    colors = ["#d3d3d3"];
    labels = ["Sem meta"];

  } else {
    const percentual = (real / obj) * 100;
    let corPrincipal;

    if (percentual >= 85) {
      corPrincipal = "#4caf50";
    } else if (percentual > 50) {
      corPrincipal = "#ffc107";
    } else {
      corPrincipal = "#f44336";
    }

    const realSlice = real;
    const restanteSlice = Math.max(obj - real, 0);

    if (realSlice >= obj) {
      data = [realSlice];
      colors = [corPrincipal];
      labels = ["Realizado"];
    } else {
      data = [realSlice, restanteSlice];
      colors = [corPrincipal, "#e9e9e9"];
      labels = ["Realizado", "Restante"];
    }
  }

  const inst = new ChartLib(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 1 }],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              if (obj <= 0) return `Sem meta`;

              const idx = context.dataIndex;
              if (idx === 0) {
                return `Real: ${real} (Meta: ${obj})`;
              }
              const restanteVal = Math.max(obj - real, 0);
              return `Restante: ${restanteVal}`;
            }
          }
        }
      }
    }
  });

  doughnutInstances.push(inst);
}