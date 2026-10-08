const formMovimentacao = document.getElementById("formMovimentacao");
const selecaoVeiculo = document.getElementById("veiculo");
const corpoTabela = document.getElementById("corpoTabela");
const mensagem = document.getElementById("mensagem");
const filtroMovimentacao = document.getElementById("filtroMovimentacao");
const filtroEstado = document.getElementById("filtroEstado");
let dadosAtuais = { veiculos: [], movimentacoes: [] };
const botoesMovimento = [...formMovimentacao.querySelectorAll("button[type='submit']")];

function mostrar(texto, sucesso = false) {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${sucesso ? "sucesso" : "erro"}`;
}

function formatarData(valor) {
  const data = new Date(valor.replace(" ", "T"));
  return Number.isNaN(data.getTime())
    ? valor
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

function mostrarMovimentacoes(movimentacoes) {
  corpoTabela.replaceChildren();
  if (movimentacoes.length === 0) {
    const linha = corpoTabela.insertRow();
    const celula = linha.insertCell();
    celula.colSpan = 7;
    celula.className = "vazio";
    celula.textContent = "Nenhuma movimentação registrada.";
    return;
  }

  const termo = filtroMovimentacao.value.trim().toLowerCase();
  const estados = new Map(dadosAtuais.veiculos.map(veiculo => [veiculo.placa, veiculo.status]));
  const filtradas = movimentacoes.filter(movimentacao => {
    const texto = `${movimentacao.morador} ${movimentacao.apto} ${movimentacao.placa}`.toLowerCase();
    return (!termo || texto.includes(termo)) && (filtroEstado.value === "todos" || estados.get(movimentacao.placa) === filtroEstado.value);
  });
  if (filtradas.length === 0) {
    const linha = corpoTabela.insertRow();
    const celula = linha.insertCell();
    celula.colSpan = 7;
    celula.className = "vazio";
    celula.textContent = "Nenhuma movimentação corresponde aos filtros.";
    return;
  }
  filtradas.forEach(movimentacao => {
    const linha = corpoTabela.insertRow();
    [formatarData(movimentacao.registrado_em), movimentacao.apto, movimentacao.morador, movimentacao.placa, movimentacao.marca_modelo ?? "-", estados.get(movimentacao.placa) ?? "-", movimentacao.movimento].forEach(valor => {
      linha.insertCell().textContent = valor;
    });
  });
}

function atualizarAcoes() {
  const veiculo = dadosAtuais.veiculos.find(item => String(item.id) === selecaoVeiculo.value);
  botoesMovimento.forEach(botao => {
    botao.disabled = !veiculo || botao.value === (veiculo.status === "Dentro" ? "Entrada" : "Saída");
  });
}

async function carregar() {
  try {
    const resposta = await fetch("/api/v1/movimentacoes");
    if (!resposta.ok) throw new Error("Falha ao carregar movimentações.");
    const dados = await resposta.json();
    dadosAtuais = dados;
    const selecionado = selecaoVeiculo.value;
    selecaoVeiculo.replaceChildren(new Option("Selecione um carro...", ""));
    dados.veiculos.forEach(veiculo => {
      selecaoVeiculo.add(new Option(`${veiculo.placa} - ${veiculo.morador} - Apto ${veiculo.apto} - ${veiculo.status}`, veiculo.id));
    });
    if (dados.veiculos.some(veiculo => String(veiculo.id) === selecionado)) selecaoVeiculo.value = selecionado;
    if (dados.veiculos.length === 0) selecaoVeiculo.options[0].textContent = "Nenhum carro ativo com placa cadastrada";
    atualizarAcoes();
    mostrarMovimentacoes(dados.movimentacoes);
  } catch {
    mostrar("Não foi possível carregar os dados.");
  }
}

formMovimentacao.addEventListener("submit", async evento => {
  evento.preventDefault();
  const botoes = botoesMovimento;
  const movimento = evento.submitter?.value;
  botoes.forEach(botao => botao.disabled = true);

  try {
    const resposta = await fetch("/api/v1/movimentacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ veiculo_id: selecaoVeiculo.value, movimento })
    });
    const resultado = await resposta.json();
    if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível registrar a movimentação.");
    mostrar(`${resultado.movimento} registrada para ${resultado.placa}.`, true);
    await carregar();
  } catch (erro) {
    mostrar(erro.message || "Não foi possível conectar ao servidor.");
  } finally {
    botoes.forEach(botao => botao.disabled = false);
    atualizarAcoes();
  }
});

selecaoVeiculo.addEventListener("change", atualizarAcoes);

function exportarCSV() {
  const estados = new Map(dadosAtuais.veiculos.map(veiculo => [veiculo.placa, veiculo.status]));
  const linhas = [["Data/hora", "Apto", "Morador", "Placa", "Marca/Modelo", "Estado atual", "Movimento"]];
  dadosAtuais.movimentacoes.forEach(m => linhas.push([formatarData(m.registrado_em), m.apto, m.morador, m.placa, m.marca_modelo ?? "-", estados.get(m.placa) ?? "-", m.movimento]));
  const csv = linhas.map(linha => linha.map(valor => `"${String(valor).replaceAll('"', '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  link.download = "movimentacoes.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

filtroMovimentacao.addEventListener("input", () => mostrarMovimentacoes(dadosAtuais.movimentacoes));
filtroEstado.addEventListener("change", () => mostrarMovimentacoes(dadosAtuais.movimentacoes));
document.getElementById("exportarMovimentacoes").addEventListener("click", exportarCSV);

carregar();
