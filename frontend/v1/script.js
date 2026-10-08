const config = {
  morador:    { rotulo: "Nome do Morador",    placeholder: "Ex.: João Silva" },
  placa:      { rotulo: "Placa do Carro",     placeholder: "Ex.: ABC1D23" },
  apto:       { rotulo: "Número do Apto",     placeholder: "Ex.: 101" }
};

let tipoAtual = "morador";
let moradores = [];
let paginaAtual = 1;
const porPagina = 8;

const campo = document.getElementById("campoBusca");
const rotulo = document.getElementById("rotulo");
const resultados = document.getElementById("resultados");
const paginacao = document.getElementById("paginacao");
const filtros = ["filtroTipo", "filtroStatus", "filtroVeiculo"].map(id => document.getElementById(id));

document.getElementById("limparPesquisa").addEventListener("click", () => {
  campo.value = "";
  resultados.replaceChildren();
  paginacao.replaceChildren();
  campo.focus();
});

document.querySelectorAll(".opcao").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".opcao").forEach(b => b.classList.remove("ativa"));
    btn.classList.add("ativa");
    tipoAtual = btn.dataset.tipo;
    rotulo.textContent = config[tipoAtual].rotulo;
    campo.placeholder = config[tipoAtual].placeholder;
    campo.value = "";
    resultados.innerHTML = "";
    campo.focus();
  });
});

const normalizar = txt => String(txt ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]/g, "").toLowerCase();

document.getElementById("formBusca").addEventListener("submit", async e => {
  e.preventDefault();
  paginaAtual = 1;
  renderizarResultados();
});

function filtrar() {
  const termo = normalizar(campo.value);
  const tipo = document.getElementById("filtroTipo").value;
  const status = document.getElementById("filtroStatus").value;
  const veiculo = document.getElementById("filtroVeiculo").value;
  return moradores.filter(m => {
    const valor = tipoAtual === "placa" && m.veiculos?.length ? m.veiculos.map(v => v.placa).filter(Boolean).join(" ") : m[tipoAtual];
    const veiculos = m.veiculos ?? [];
    const combinaVeiculo = veiculo === "sem" ? veiculos.length === 0 : !veiculo || veiculos.some(v => v.tipo === veiculo);
    return normalizar(valor).includes(termo)
      && (!tipo || m.tipo === tipo)
      && (status === "todos" || (status === "ativo" ? m.ativo !== false : m.ativo === false))
      && combinaVeiculo;
  });
}

function renderizarResultados() {
  const lista = filtrar();
  exibir(lista.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina), lista.length);
  const paginas = Math.ceil(lista.length / porPagina);
  paginacao.replaceChildren();
  if (paginas < 2) return;
  const info = document.createElement("span");
  info.textContent = `Página ${paginaAtual} de ${paginas}`;
  const anterior = document.createElement("button");
  anterior.textContent = "Anterior";
  anterior.disabled = paginaAtual === 1;
  anterior.addEventListener("click", () => { paginaAtual--; renderizarResultados(); });
  const proxima = document.createElement("button");
  proxima.textContent = "Próxima";
  proxima.disabled = paginaAtual === paginas;
  proxima.addEventListener("click", () => { paginaAtual++; renderizarResultados(); });
  paginacao.append(anterior, info, proxima);
}

function exibir(lista, total) {
  resultados.innerHTML = "";
  if (lista.length === 0) {
    const p = document.createElement("p");
    p.className = "vazio";
    p.textContent = total === 0 ? "Nenhum resultado encontrado." : "Nenhum resultado nesta página.";
    resultados.appendChild(p);
    return;
  }
  lista.forEach(m => {
    const card = document.createElement("div");
    card.className = "card";
    const botao = document.createElement("a");
    botao.className = "botao-expandir";
    botao.href = `/v1/morador/${encodeURIComponent(m.apto)}`;
    botao.textContent = "Expandir";
    card.appendChild(botao);
     const linhas = [
      ["h3", m.morador],
      ["p", `Apto: ${m.apto}`],
      ["p", `Carro/Moto: ${m.veiculo ?? "-"}`],
      ["p", `Placa: ${m.placa ?? "-"}`],
      ["p", `Marca/Modelo: ${m.marca_modelo ?? "-"}`]
    ];
    linhas.forEach(([tag, texto]) => {
      const el = document.createElement(tag);
      el.textContent = texto;
      card.appendChild(el);
    });
     resultados.appendChild(card);
  });
}

function atualizarDashboard() {
  const ativos = moradores.filter(m => m.ativo !== false);
  const veiculos = ativos.flatMap(m => m.veiculos ?? []);
  document.getElementById("totalMoradores").textContent = ativos.length;
  document.getElementById("totalProprietarios").textContent = ativos.filter(m => m.tipo === "Proprietário").length;
  document.getElementById("totalLocatarios").textContent = ativos.filter(m => m.tipo === "Locatário").length;
  document.getElementById("totalVeiculos").textContent = veiculos.length;
  document.getElementById("atualizadoEm").textContent = `Atualizado às ${new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date())}`;
  fetch("/api/v1/movimentacoes").then(resp => resp.json()).then(dados => {
    document.getElementById("totalDentro").textContent = dados.veiculos.filter(v => v.status === "Dentro").length;
  }).catch(() => document.getElementById("totalDentro").textContent = "-");
}

filtros.forEach(filtro => filtro.addEventListener("change", () => { paginaAtual = 1; renderizarResultados(); }));

fetch("/api/moradores")
  .then(resp => { if (!resp.ok) throw new Error(); return resp.json(); })
  .then(dados => { moradores = dados; atualizarDashboard(); renderizarResultados(); })
  .catch(() => { resultados.innerHTML = '<p class="vazio">Não foi possível conectar ao servidor.</p>'; });
