let dados = { relatorios: [] };

const dataSelect = document.getElementById("dataSelect");
const horaSelect = document.getElementById("horaSelect");
const container = document.getElementById("relatoriosContainer");

function carregarDados() {
  let dadosDoMes = null;

  if (typeof dadosProdutivosOut25 !== "undefined" && dadosProdutivosOut25.relatorios) {
    dadosDoMes = dadosProdutivosOut25;
  } else if (typeof dadosProdutivosNov25 !== "undefined" && dadosProdutivosNov25.relatorios) {
    dadosDoMes = dadosProdutivosNov25;
  }

  if (dadosDoMes) {
    document.body.classList.add("has-month");

    dados.relatorios = dadosDoMes.relatorios.slice();

    preencherDatas();
    
    if (dados.relatorios.length > 0) {
      dataSelect.value = dados.relatorios[0].data;
    }
    
    render(); 
  } else {
    container.innerHTML = `<p style="color:red;">Erro: Nenhuma variável de dados (ex: dadosProdutivosNov25) foi encontrada. Verifique o arquivo de dados e a ordem de carregamento no HTML.</p>`;
  }
}

function preencherDatas() {
  dataSelect.innerHTML = "";
  if (!dados.relatorios.length) return;

  dados.relatorios.forEach((r) => {
  const opt = document.createElement("option");
  opt.value = r.data;
  opt.textContent = r.data;
  dataSelect.appendChild(opt);
  });
}

dataSelect.addEventListener("change", render);
horaSelect.addEventListener("change", render);

function render() {
  container.innerHTML = "";

  const dataSel = dataSelect.value || dados.relatorios[0]?.data;
  const horaSel = horaSelect.value;

  const relatorio = dados.relatorios.find((r) => r.data === dataSel);
  if (!relatorio) return;

  const maquinas = [
  ...new Set(relatorio.horarios.flatMap((h) => h.maquinas.map((m) => m.nome))),
  ];

  maquinas.forEach((nomeMaquina) => {
  const section = document.createElement("div");
  section.classList.add("relatorio-maquina");

  const titulo = document.createElement("h2");
  titulo.textContent = `${nomeMaquina} – ${dataSel}`;
  section.appendChild(titulo);

  const cardsContainer = document.createElement("div");
  cardsContainer.classList.add("cards-horarios");

  const horariosParaMostrar = horaSel
    ? relatorio.horarios.filter((h) => h.hora === horaSel)
    : relatorio.horarios;

  horariosParaMostrar.forEach((h) => {
    const maquina = h.maquinas.find((m) => m.nome === nomeMaquina);
    const card = document.createElement("div");
    card.classList.add("card");

    const h3 = document.createElement("h3");
    h3.textContent = h.hora;
    card.appendChild(h3);

    if (!maquina) {
      const p = document.createElement("p");
      p.textContent = "Sem registro neste horário.";
      card.appendChild(p);
    } else {
      const p1 = document.createElement("p");
      p1.innerHTML = `<strong>Obj:</strong> ${maquina.obj}`;
      const p2 = document.createElement("p");
      p2.innerHTML = `<strong>Real:</strong> ${maquina.real}`;
      const p3 = document.createElement("p");
      p3.innerHTML = `<strong>%:</strong> <span class="${getPercentClass(
        maquina.percentual
      )}">${maquina.percentual}%</span>`;
      const p4 = document.createElement("p");
      p4.innerHTML = `<strong>Obs:</strong> ${
        maquina.obs?.trim() || "—"
      }`;

      [p1, p2, p3, p4].forEach((el) => card.appendChild(el));
    }

    cardsContainer.appendChild(card);
  });

  section.appendChild(cardsContainer);
  container.appendChild(section);
  });
}

function getPercentClass(valor) {
    if (isNaN(valor)) return "";
    if (valor >= 80) return "percentual-alto";
    if (valor >= 50) return "percentual-medio";
    return "percentual-baixo";
}

carregarDados();