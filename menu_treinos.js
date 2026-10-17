const treinos = JSON.parse(localStorage.getItem("treinos")) || {};
const CHAVE_MODOS_TREINO_DIA = "modos_treino_por_dia";
const modos_treino_por_dia = JSON.parse(localStorage.getItem(CHAVE_MODOS_TREINO_DIA)) || {};
// treinos[chave_dia] = [
//   { id: 1, nome: "Peito e Tríceps", autoavaliacao: 85, exercicios: [
//       { nome, categoria, musculo, detalhes,      // exercício escolhido no dicionário + detalhes de execução (máx. 300 caracteres)
//         rm_diario: "100", rm_unidade: "Kg",       // "stipulated daily RM" (só números) + unidade de medida
//         tabela: { secoes: [ {tipo: "reps"|"meters"|"seconds", unidade: "Kg"|"%"|"RIR"|"RPE"}, ... ],
//                   series: [ {sets: int, valores: [ {reps, intensidade}, ... ]}, ... ] } },

//       { separador: true, nome: "Peito e Tríceps", horas: "18", minutos: "30" },
//       { nome, categoria, musculo, detalhes }, ... ] }
// (treinos antigos com sets, reps, intensity são convertidos para a tabela ao serem abertos; pb e notas mantêm-se)
// ]
// Agora só existe 1 treino por dia (o array tem no máximo 1 elemento, o que mantém compatível o que já está no localStorage)

const notas_dia = JSON.parse(localStorage.getItem("notas_dia")) || {};
// notas_dia[chave_dia] = { notas: "..." }
let dia_notas_atual, mes_notas_atual, ano_notas_atual; // dia cujas notas estão a ser editadas

let proximo_id_treino = 1;
for (const chave in treinos) {
    if (Array.isArray(treinos[chave])) {
        treinos[chave].forEach(t => {
            if (t.id >= proximo_id_treino) {
                proximo_id_treino = t.id + 1;
            }
        });
    }
}
let contador_exercicios = 0;
let contador_separadores = 0;
let separador_em_edicao = null;      // id do separador cuja hora está a ser escolhida
let dia_atual, mes_atual, ano_atual; // dia em que estamos a trabalhar
let treino_em_edicao = null;         // id do treino a editar, ou null = treino novo
let modo_leitura = false;
let temporizador_autoavaliacao = null;

/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

const nomes_meses = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dias_semana = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const hoje = new Date();
let mes = hoje.getMonth() + 1; // 1 = Janeiro, 12 = Dezembro
let ano = hoje.getFullYear();


function chave_treino(dia, mes, ano) {
    return `${ano}-${mes}-${dia}`;
}

/* abrir o dia (clicar na célula do calendário) */

function abrir_dia(dia, mes, ano) {
    const chave = chave_treino(dia, mes, ano);
    const treino_do_dia = (treinos[chave] || [])[0] || null;

    dia_atual = dia;
    mes_atual = mes;
    ano_atual = ano;

    fechar_calendario();
    document.getElementById("botão_menu").style.display = "none";

    // qualquer dia (passado, hoje ou futuro) abre o ecrã de edição
    treino_em_edicao = treino_do_dia ? treino_do_dia.id : null; // null = treino novo
    mostrar_tela_editar_treino();
}

/* tela editar treino */

function mostrar_tela_editar_treino() {
    retorno_para_edicao = null;
    const chave = chave_treino(dia_atual, mes_atual, ano_atual);
    definir_modo_leitura(modos_treino_por_dia[chave] === true);
    document.getElementById("lista_exercicios").innerHTML = "";
    document.getElementById("lista_exercicios").scrollTop = 0; // abre sempre no topo

    contador_exercicios = 0;
    contador_separadores = 0;
    atualizar_botao_agrupamento();
    const campo_autoavaliacao = document.getElementById("autoavaliacao_treino");
    campo_autoavaliacao.value = "";
    atualizar_disponibilidade_autoavaliacao();
    agendar_atualizacao_autoavaliacao();

    if (treino_em_edicao !== null) {
        // estamos a editar um treino existente: ir buscá-lo e preencher
        const treino = (treinos[chave] || []).find(t => t.id === treino_em_edicao);

        if (treino) {
            campo_autoavaliacao.value = treino.autoavaliacao == null ? "" : String(treino.autoavaliacao);
            document.getElementById("texto_edit_treino").textContent =
                `Edit Workout - ${dia_atual}/${mes_atual}/${ano_atual}`;
            const itens = Array.isArray(treino.exercicios) ? treino.exercicios.map(ex => ({ ...ex })) : [];
            const tem_nomes_nas_secoes = itens.some(ex => ex.separador && ex.nome);
            if (treino.nome && !tem_nomes_nas_secoes) {
                if (itens[0] && itens[0].separador) {
                    itens[0].nome = treino.nome;
                } else {
                    itens.unshift({
                        separador: true,
                        nome: treino.nome,
                        horas: HORA_PADRAO,
                        minutos: MINUTOS_PADRAO
                    });
                }
                itens.forEach(ex => {
                    if (ex.separador && !ex.nome) ex.nome = treino.nome;
                });
            }

            itens.forEach(ex => {
                if (ex.separador) {
                    adicionar_separador(ex.horas, ex.minutos, false, ex.nome || "");
                    return;
                }
                adicionar_exercicio(false, ex);
            });
        }
    } else {
        document.getElementById("texto_edit_treino").textContent =
            `New Workout - ${dia_atual}/${mes_atual}/${ano_atual}`;
        adicionar_separador("", "", false);
    }

    atualizar_ligacoes_exercicios();
    definir_modo_leitura(modos_treino_por_dia[chave] === true);
    document.getElementById("tela_editar_treino").style.display = "block";
    requestAnimationFrame(atualizar_ligacoes_exercicios);
}

function fechar_tela_editar_treino(){
    fechar_confirmacao_limpar_treino();
    clearTimeout(temporizador_autoavaliacao);
    temporizador_autoavaliacao = null;
    treino_em_edicao = null;
    fechar_info_exercicio();
    document.getElementById("tela_editar_treino").style.display = "none";
    regenerar_calendario();
    document.getElementById("botão_menu").style.display = "block";
    document.getElementById("botao_bloco_notas").style.display = "block";
}

/* botão "Separar": cria uma linha divisória com a hora a que se faz o que vem a seguir */

/* hora por defeito dos separadores, se o utilizador não escolher nenhuma */
const HORA_PADRAO = "00";
const MINUTOS_PADRAO = "00";

function adicionar_separador(horas = "", minutos = "", rolar = true, nome = "") {
    horas = horas || HORA_PADRAO;       // "" (treinos antigos sem hora) também fica 00:00
    minutos = minutos || MINUTOS_PADRAO;

    contador_separadores++;
    const id = contador_separadores;
    const lista = document.getElementById("lista_exercicios");

    const linha = document.createElement("div");
    linha.classList.add("linha_separador");
    linha.id = `separador_${id}`;

    linha.innerHTML = `
        <span class="traco_separador"></span>
        <input type="text" class="input_nome_sep" maxlength="30" placeholder="Workout name..." aria-label="Workout name">
        <button class="botao_hora_separador" onclick="slecionar_horas(${id})">Time: ${horas}:${minutos}</button>
        <input type="hidden" class="input_horas_sep" value="">
        <input type="hidden" class="input_minutos_sep" value="">
        <span class="traco_separador"></span>
        <button class="botao_mover_separador" title="Move up" onclick="mover_separador(${id}, 'cima')">&#9650;</button>
        <button class="botao_mover_separador" title="Move down" onclick="mover_separador(${id}, 'baixo')">&#9660;</button>
        <button class="botao_remover_separador" title="Remove separator" onclick="remover_separador(${id})">X</button>
    `;

    linha.querySelector(".input_horas_sep").value = horas;
    linha.querySelector(".input_minutos_sep").value = minutos;
    linha.querySelector(".input_nome_sep").value = String(nome || "").slice(0, 30);

    lista.appendChild(linha); // os exercícios criados a seguir ficam por baixo dele

    if (rolar) lista.scrollTop = lista.scrollHeight; // mostra o separador acabado de criar
}

/* mover uma linha da lista (separador ou caixa de exercício) uma posição para cima ou para baixo */
function mover_linha(linha, direcao) {
    if (!linha) return;
    const lista = linha.parentElement;

    if (direcao === "cima") {
        const anterior = linha.previousElementSibling;
        if (anterior) lista.insertBefore(linha, anterior);
    } else {
        const seguinte = linha.nextElementSibling;
        if (seguinte) lista.insertBefore(seguinte, linha);
    }

    renumerar_exercicios();
    atualizar_ligacoes_exercicios();
    if (linha.scrollIntoView) linha.scrollIntoView({ block: "nearest" }); // mantém a linha visível se a lista tiver scroll
}

function mover_separador(id, direcao) {
    const linha = document.getElementById(`separador_${id}`);
    mover_linha(linha, direcao);
}

function mover_exercicio(id, direcao) {
    mover_linha(document.getElementById(`exercicio_${id}`), direcao);
}

// o número de cada caixa segue a ordem em que estão na lista (os separadores não contam)
function renumerar_exercicios() {
    document.querySelectorAll("#lista_exercicios .linha_exercicio").forEach((linha, i) => {
        linha.querySelector(".ex_numero").textContent = i + 1;
    });
}

function alternar_agrupamento_exercicios() {
    if (modo_leitura) return;
    const selecionados = obter_exercicios_selecionados_agrupamento();
    if (selecionados.length < 2) {
        const botao = document.getElementById("botao_agrupar_exercicios");
        if (botao && !botao.classList.contains("agrupamento_pronto")) {
            alert("You have to select at least 2 items");
        }
        return;
    }

    selecionados.sort((a, b) => {
        const posicao = a.compareDocumentPosition(b);
        return posicao & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    const id_ligacao = `ligacao_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    selecionados.forEach(linha => {
        if (!linha._linksAgrupamento.includes(id_ligacao)) linha._linksAgrupamento.push(id_ligacao);
        linha._legado.grupos_ligacao = [...linha._linksAgrupamento];
    });

    const ancora = selecionados[0];
    selecionados.slice(1).forEach(linha => linha.remove());
    const referencia = ancora.nextElementSibling;
    const fragmento = document.createDocumentFragment();
    selecionados.slice(1).forEach(linha => fragmento.appendChild(linha));
    document.getElementById("lista_exercicios").insertBefore(fragmento, referencia);

    document.querySelectorAll("#lista_exercicios .ex_agrupar_selecao").forEach(campo => {
        campo.checked = false;
    });
    renumerar_exercicios();
    atualizar_botao_agrupamento();
    atualizar_ligacoes_exercicios();
}

function obter_exercicios_selecionados_agrupamento() {
    return [...document.querySelectorAll("#lista_exercicios .ex_agrupar_selecao:checked")]
        .map(campo => campo.closest(".linha_exercicio"));
}

function desagrupar_exercicios() {
    if (modo_leitura) return;
    const selecionados = obter_exercicios_selecionados_agrupamento();
    if (selecionados.length < 2) {
        const botao = document.getElementById("botao_desagrupar_exercicios");
        if (botao && !botao.classList.contains("agrupamento_pronto")) {
            alert("You have to select at least 2 items");
        }
        return;
    }

    selecionados.forEach(linha => {
        linha._linksAgrupamento = [];
        linha._legado.grupos_ligacao = [];
        linha.querySelector(".ex_agrupar_selecao").checked = false;
    });
    limpar_ligacoes_exercicios_obsoletas();
    atualizar_botao_agrupamento();
}

function atualizar_botao_agrupamento() {
    const selecionados = document.querySelectorAll("#lista_exercicios .ex_agrupar_selecao:checked").length;
    const pronto = selecionados >= 2;
    const botao_agrupar = document.getElementById("botao_agrupar_exercicios");
    const botao_desagrupar = document.getElementById("botao_desagrupar_exercicios");
    [botao_agrupar, botao_desagrupar].forEach(botao => {
        if (botao) botao.classList.toggle("agrupamento_pronto", pronto);
    });
    if (botao_agrupar) botao_agrupar.setAttribute("aria-label", pronto ? "Group selected exercises" : "Select at least two exercises to group");
    if (botao_desagrupar) botao_desagrupar.setAttribute("aria-label", pronto ? "Ungroup selected exercises" : "Select at least two exercises to ungroup");
    atualizar_ligacoes_exercicios();
}

function atualizar_ligacoes_exercicios() {
    desenhar_ligacoes_exercicios(document.getElementById("lista_exercicios"), modo_leitura);
}

// Desenha os pontos, as ligações horizontais e as linhas verticais de agrupamento de uma lista de caixas de exercício.
// Serve a tela de edição (#lista_exercicios) e a tela "Search through time".
// usar_pontos = true (modo leitura): liga a partir do ponto azul; false (modo edição): liga a partir da checkbox.
function desenhar_ligacoes_exercicios(lista, usar_pontos) {
    if (!lista) return;
    let svg = lista.querySelector(":scope > .ex_ligacoes_svg");
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("ex_ligacoes_svg");
        svg.setAttribute("aria-hidden", "true");
        lista.prepend(svg);
    }
    svg.replaceChildren();
    // encolhe o SVG antes de medir, para que o tamanho antigo não conte para o scrollHeight da lista
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    const largura_lista = lista.clientWidth;
    const altura_lista = lista.scrollHeight;
    svg.setAttribute("width", String(largura_lista));
    svg.setAttribute("height", String(altura_lista));
    svg.setAttribute("viewBox", `0 0 ${largura_lista} ${altura_lista}`);

    const lista_rect = lista.getBoundingClientRect();
    const grupos = new Map();
    const selecionados = [];
    lista.querySelectorAll(".linha_exercicio").forEach(linha => {
        const checkbox = linha.querySelector(".ex_agrupar_selecao");
        const ponto_ligacao = usar_pontos
            ? linha.querySelector(".ex_ponto_ligacao")
            : checkbox;
        if (!ponto_ligacao) return;
        const rect = ponto_ligacao.getBoundingClientRect();
        const ponto = {
            x: rect.left - lista_rect.left + lista.scrollLeft + rect.width / 2,
            y: rect.top - lista_rect.top + lista.scrollTop + rect.height / 2
        };
        const caixa = linha.getBoundingClientRect();
        const ramo_x1 = rect.right - lista_rect.left + lista.scrollLeft;
        const ramo_x2 = caixa.left - lista_rect.left + lista.scrollLeft;
        const ramo = document.createElementNS("http://www.w3.org/2000/svg", "path");
        ramo.setAttribute("d", `M ${Math.round(ramo_x1)} ${Math.round(ponto.y) + 0.5} H ${Math.round(ramo_x2)}`);
        ramo.setAttribute("class", "ex_ligacao_horizontal");
        svg.appendChild(ramo);

        if (!usar_pontos && checkbox && checkbox.checked) selecionados.push(ponto);
        (linha._linksAgrupamento || []).forEach(id => {
            if (!grupos.has(id)) grupos.set(id, []);
            grupos.get(id).push(ponto);
        });
    });
    if (selecionados.length > 1) grupos.set("__selecao_atual__", selecionados);

    grupos.forEach(pontos => {
        if (pontos.length < 2) return;
        const x = Math.round(pontos.reduce((total, ponto) => total + ponto.x, 0) / pontos.length) + 0.5;
        const topo = Math.round(Math.min(...pontos.map(ponto => ponto.y))) + 0.5;
        const fundo = Math.round(Math.max(...pontos.map(ponto => ponto.y))) + 0.5;
        const trilho = document.createElementNS("http://www.w3.org/2000/svg", "path");
        trilho.setAttribute("d", `M ${x} ${topo} V ${fundo}`);
        trilho.setAttribute("class", "ex_ligacao_vertical");
        svg.appendChild(trilho);
        pontos.forEach(ponto => {
            const ramo = document.createElementNS("http://www.w3.org/2000/svg", "path");
            ramo.setAttribute("d", `M ${Math.min(x, Math.round(ponto.x) + 0.5)} ${Math.round(ponto.y) + 0.5} H ${Math.max(x, Math.round(ponto.x) + 0.5)}`);
            ramo.setAttribute("class", "ex_ligacao_vertical");
            svg.appendChild(ramo);
        });
    });
}

function limpar_ligacoes_exercicios_obsoletas() {
    const contagens = new Map();
    document.querySelectorAll("#lista_exercicios .linha_exercicio").forEach(linha => {
        linha._linksAgrupamento.forEach(id => contagens.set(id, (contagens.get(id) || 0) + 1));
    });
    document.querySelectorAll("#lista_exercicios .linha_exercicio").forEach(linha => {
        linha._linksAgrupamento = linha._linksAgrupamento.filter(id => contagens.get(id) > 1);
        linha._legado.grupos_ligacao = [...linha._linksAgrupamento];
    });
    atualizar_ligacoes_exercicios();
}

function exercicio_dicionario_por_nome(nome) {
    const normalizado = normalizar_texto(nome);
    return exercicios_do_dicionario().find(ex => normalizar_texto(ex.nome) === normalizado) || null;
}

function abrir_info_exercicio(id) {
    const linha = document.getElementById(`exercicio_${id}`);
    const exercicio_dicionario = linha && linha._exercicio
        ? exercicio_dicionario_por_nome(linha._exercicio.nome)
        : null;
    if (!exercicio_dicionario) return;

    document.getElementById("titulo_info_exercicio").textContent = exercicio_dicionario.nome;
    document.getElementById("descricao_info_exercicio").textContent =
        exercicio_dicionario.descricao || "No description defined.";
    document.getElementById("pr_info_exercicio").textContent =
        exercicio_dicionario.pr_valor
            ? `${exercicio_dicionario.pr_valor} ${exercicio_dicionario.pr_unidade || ""}${formatar_forca_relativa_pr(exercicio_dicionario)}`.trim()
            : "No PR defined.";
    document.getElementById("bw_pr_info_exercicio").textContent =
        exercicio_dicionario.bw_at_pr !== undefined && exercicio_dicionario.bw_at_pr !== ""
            ? `${exercicio_dicionario.bw_at_pr} ${exercicio_dicionario.bw_at_pr_unidade || "Kg"}`
            : "No body weight recorded.";
    document.getElementById("data_pr_info_exercicio").textContent = formatar_data_pr(exercicio_dicionario);
    const categorias = Array.isArray(exercicio_dicionario.categorias) && exercicio_dicionario.categorias.length > 0
        ? exercicio_dicionario.categorias
        : String(exercicio_dicionario.categoria || "").split(",").map(valor => valor.trim()).filter(Boolean);
    const musculos = Array.isArray(exercicio_dicionario.musculos) && exercicio_dicionario.musculos.length > 0
        ? exercicio_dicionario.musculos
        : String(exercicio_dicionario.musculo || "").split(",").map(valor => valor.trim()).filter(Boolean);
    document.getElementById("categorias_info_exercicio").textContent =
        categorias.join(", ") || "No categories defined.";
    document.getElementById("musculos_info_exercicio").textContent =
        musculos.join(", ") || "No target muscles defined.";

    const link = document.getElementById("link_info_exercicio");
    const endereco = String(exercicio_dicionario.link || "").trim();
    link.removeAttribute("href");
    link.hidden = true;
    if (endereco) {
        try {
            const url = new URL(/^https?:\/\//i.test(endereco) ? endereco : `https://${endereco}`);
            if (url.protocol === "http:" || url.protocol === "https:") {
                link.href = url.href;
                link.textContent = endereco;
                link.hidden = false;
            }
        } catch (erro) {
            console.warn("Invalid exercise video URL in dictionary:", endereco, erro);
        }
    }
    document.getElementById("sem_link_info_exercicio").hidden = !link.hidden;
    document.getElementById("tela_info_exercicio").style.display = "flex";
}

function fechar_info_exercicio() {
    const tela = document.getElementById("tela_info_exercicio");
    if (tela) tela.style.display = "none";
}

function definir_modo_leitura(leitura) {
    modo_leitura = leitura;
    const tela = document.getElementById("tela_editar_treino");
    tela.classList.toggle("modo_leitura", leitura);
    const botao = document.getElementById("botao_modo_treino");
    botao.textContent = leitura ? "Reading mode" : "Editing mode";
    botao.setAttribute("aria-pressed", String(leitura));

    tela.querySelectorAll(".ex_textarea, .ex_rm_valor, .ex_cel_sets, .ex_cel_reps, .ex_cel_int, .input_nome_sep")
        .forEach(campo => { campo.readOnly = leitura; });
    tela.querySelectorAll("select, .botao_hora_separador")
        .forEach(campo => { campo.disabled = leitura; });
    if (leitura) {
        tela.querySelectorAll(".ex_agrupar_selecao").forEach(campo => { campo.checked = false; });
    }
    atualizar_botao_agrupamento();

    if (Number.isInteger(dia_atual) && Number.isInteger(mes_atual) && Number.isInteger(ano_atual)) {
        const chave = chave_treino(dia_atual, mes_atual, ano_atual);
        modos_treino_por_dia[chave] = leitura;
        localStorage.setItem(CHAVE_MODOS_TREINO_DIA, JSON.stringify(modos_treino_por_dia));
    }
}

function alternar_modo_treino() {
    definir_modo_leitura(!modo_leitura);
}

function remover_separador(id) {
    const linha = document.getElementById(`separador_${id}`);
    if (linha) linha.remove();
    atualizar_ligacoes_exercicios();
    fechar_tela_horas(); // se a tela de horas estiver aberta, fecha-a também
}

/* ---------- pesquisa no dicionário de exercícios (menu_exercicios.js) ---------- */

const MAX_CARACTERES_DETALHES = 300;

function normalizar_texto(texto) {
    // sem maiúsculas nem acentos, para "leg" encontrar "Leg Extension" e "gluteos" encontrar "Glúteos"
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function exercicios_do_dicionario() {
    const lista = window.obter_exercicios_dicionario ? window.obter_exercicios_dicionario() : window.dicionario_exercicios;
    return Array.isArray(lista) ? lista : [];
}

function musculo_do_exercicio(ex) {
    const m = ex.musculos !== undefined ? ex.musculos : ex.musculo; // aceita um músculo (texto) ou vários (lista)
    return Array.isArray(m) ? m.join(", ") : String(m || "");
}

// campo: "nome" | "categoria" | "musculo"
function pesquisar_dicionario(termo, categorias = new Set(), musculos = new Set()) {
    const todos = exercicios_do_dicionario();
    const t = normalizar_texto(termo);

    return todos.filter(ex => {
        const categorias_ex = Array.isArray(ex.categorias)
            ? ex.categorias
            : String(ex.categoria || "").split(",").map(valor => valor.trim()).filter(Boolean);
        const musculos_ex = Array.isArray(ex.musculos)
            ? ex.musculos
            : String(ex.musculo || "").split(",").map(valor => valor.trim()).filter(Boolean);
        const matchNome = !t || normalizar_texto(ex.nome).includes(t);
        const matchCategorias = [...categorias].every(filtro =>
            categorias_ex.some(valor => normalizar_texto(valor) === normalizar_texto(filtro))
        );
        const matchMusculos = [...musculos].every(filtro =>
            musculos_ex.some(valor => normalizar_texto(valor) === normalizar_texto(filtro))
        );
        return matchNome && matchCategorias && matchMusculos;
    });
}

function existe_no_dicionario(nome) {
    const n = normalizar_texto(nome);
    return exercicios_do_dicionario().some(ex => normalizar_texto(ex.nome) === n);
}

function atualizar_sugestoes(linha) {
    const termo = linha.querySelector(".ex_input_busca").value;
    const caixa = linha.querySelector(".ex_sugestoes");
    const categorias = linha._filtrosCategoria;
    const musculos = linha._filtrosMusculo;

    caixa.innerHTML = "";

    if (termo.trim() === "" && categorias.size === 0 && musculos.size === 0) {
        caixa.style.display = "none";
        return;
    }
    caixa.style.display = "block";

    const resultados = pesquisar_dicionario(termo, categorias, musculos);

    if (resultados.length === 0) {
        const vazio = document.createElement("div");
        vazio.classList.add("ex_vazio");
        vazio.textContent = exercicios_do_dicionario().length === 0
            ? "No exercises created yet (see Dictionary of exercises)"
            : "No exercises found";
        caixa.appendChild(vazio);
    }

    resultados.forEach(ex => {
        const item = document.createElement("div");
        item.classList.add("ex_sugestao");
        if (linha._exercicio && linha._exercicio.nome === ex.nome) item.classList.add("escolhida");

        const nome = document.createElement("span");
        nome.textContent = ex.nome;

        const extra = document.createElement("small");
        extra.textContent = [ex.categoria, musculo_do_exercicio(ex)].filter(Boolean).join(" · ");

        item.appendChild(nome);
        item.appendChild(extra);
        item.onclick = function() {
            escolher_exercicio(linha, ex);
        };
        caixa.appendChild(item);
    });

    // Permite usar o nome escrito mesmo que não exista no dicionário ou não corresponda aos filtros.
    if (termo.trim() && !existe_no_dicionario(termo.trim())) {
        const usar = document.createElement("div");
        usar.classList.add("ex_sugestao", "ex_usar_mesmo_assim");

        const texto = document.createElement("span");
        texto.textContent = "Use it anyway";

        const nome = document.createElement("small");
        nome.textContent = `"${termo.trim()}"`;

        usar.appendChild(texto);
        usar.appendChild(nome);
        usar.onclick = function() {
            usar_exercicio_desconhecido(linha, termo.trim());
        };
        caixa.appendChild(usar);
    }

}

function atualizar_rotulo_filtros_treino(linha) {
    if (!linha) return;
    const categorias = linha._filtrosCategoria || new Set();
    const musculos = linha._filtrosMusculo || new Set();
    const botao_filtros = linha.querySelector(".ex_filtros_exercicio");
    if (!botao_filtros) return;

    const ativos = categorias.size + musculos.size;
    botao_filtros.textContent = ativos
        ? `Filter by Categories and Muscles (${categorias.size}/${musculos.size})`
        : "Filter by Categories and Muscles";
    botao_filtros.classList.toggle("ativo", ativos > 0);
    botao_filtros.title = [
        categorias.size && `Categories: ${[...categorias].join(", ")}`,
        musculos.size && `Muscles: ${[...musculos].join(", ")}`
    ].filter(Boolean).join(" | ") || "Filter by categories and muscles";
}

// exercício que não está no dicionário: só fica com o nome
function usar_exercicio_desconhecido(linha, nome) {
    linha._exercicio = { nome, categoria: "", musculo: "" };
    mostrar_exercicio_escolhido(linha);

    linha.querySelector(".ex_input_busca").value = "";
    linha.querySelector(".ex_sugestoes").style.display = "none";
}

function escolher_exercicio(linha, ex) {
    linha._exercicio = {
        nome: ex.nome,
        categoria: ex.categoria || "",
        musculo: musculo_do_exercicio(ex)
    };
    mostrar_exercicio_escolhido(linha);

    // depois de escolher, limpa a pesquisa e a lista volta a esconder-se
    linha.querySelector(".ex_input_busca").value = "";
    linha.querySelector(".ex_sugestoes").style.display = "none";
}

function mostrar_exercicio_escolhido(linha) {
    const el = linha.querySelector(".ex_selecionado");
    const botao_dicionario = linha.querySelector(".ex_botao_dicionario");
    const botao_info = linha.querySelector(".ex_numero");
    const ex = linha._exercicio;
    el.textContent = "";
    botao_info.disabled = !(ex && ex.nome && exercicio_dicionario_por_nome(ex.nome));
    botao_info.title = botao_info.disabled ? "No dictionary information for this exercise" : "Show dictionary information";

    // "Save to dictionary" só aparece quando o exercício não está definido no dicionário
    botao_dicionario.style.display = (ex && ex.nome && !existe_no_dicionario(ex.nome)) ? "inline-block" : "none";

    if (!ex || !ex.nome) {
        el.textContent = "No exercise selected";
        el.classList.add("sem_escolha");
        return;
    }

    el.classList.remove("sem_escolha");
    const nome = document.createElement("strong");
    nome.textContent = ex.nome;
    el.appendChild(nome);

}

/* ---------- stipulated daily RM (só números) ---------- */

function so_numeros(input) {
    let v = input.value.replace(",", ".").replace(/[^0-9.]/g, "");
    const partes = v.split(".");
    if (partes.length > 2) v = partes[0] + "." + partes.slice(1).join(""); // só um separador decimal
    input.value = v;
}

// as mesmas unidades do "Dictionary of exercises" (UNIDADES_PR, em menu_exercicios.js)
function unidades_de_medida() {
    return (typeof UNIDADES_PR !== "undefined") ? UNIDADES_PR : ["Kg", "m/s", "m", "Km", "mi", "cm", "W", "seconds", "hours"];
}

/* ---------- tabela de séries: secções (reps | intensidade) x grupos de séries ---------- */

const UNIDADES_INTENSIDADE = ["Kg", "Lb", "%", "RIR", "RPE", "m/s", "meters", "cm", "in"];
const TIPOS_SERIE = ["reps", "meters", "Km", "mi", "seconds", "hours"];
const MAX_SECOES_TABELA = 5;
const MAX_SERIES_TABELA = 8;

function sufixo_tipo_serie(tipo) {
    return tipo === "distance" ? "m" : tipo === "time" ? "s" : "reps";
}

function normalizar_tipo_serie(tipo) {
    if (tipo === "metrers" || tipo === "meters") return "distance";
    if (tipo === "seconds") return "time";
    return TIPOS_SERIE.includes(tipo) ? tipo : TIPOS_SERIE[0];
}

function celula_vazia() {
    return { reps: "", intensidade: "" };
}

// tabela por defeito: 1 grupo de 1 série e 1 secção (reps | intensity)
function tabela_padrao() {
    return {
        secoes: [{ tipo: TIPOS_SERIE[0], unidade: UNIDADES_INTENSIDADE[0] }],
        series: [{ sets: 1, valores: [celula_vazia()] }]
    };
}

// exercícios antigos (sets, reps, intensity): 1 secção e 1 grupo com todos os sets
function tabela_a_partir_de_antigo(ex) {
    if (!ex.sets && !ex.reps && !ex.intensity) return tabela_padrao();

    const n = Math.min(Math.max(parseInt(ex.sets, 10) || 1, 1), 30);
    const intensidade = ler_intensidade(ex);
    const unidade = UNIDADES_INTENSIDADE.includes(intensidade.tipo) ? intensidade.tipo : UNIDADES_INTENSIDADE[0];

    return {
        secoes: [{ tipo: TIPOS_SERIE[0], unidade }],
        series: [{
            sets: n,
            valores: [{ reps: ex.reps || "", intensidade: intensidade.valor }]
        }]
    };
}

function normalizar_tabela(tabela) {
    const secoes = Array.isArray(tabela && tabela.secoes) && tabela.secoes.length > 0
        ? tabela.secoes.slice(0, MAX_SECOES_TABELA).map(secao => ({
            tipo: normalizar_tipo_serie(secao && secao.tipo),
            unidade: UNIDADES_INTENSIDADE.includes(secao && secao.unidade) ? secao.unidade : UNIDADES_INTENSIDADE[0]
        }))
        : [{ unidade: UNIDADES_INTENSIDADE[0] }];

    const series = Array.isArray(tabela && tabela.series)
        ? tabela.series.slice(0, MAX_SERIES_TABELA).map(serie => {
            const legado = Array.isArray(serie);
            const valores = legado ? serie : (Array.isArray(serie && serie.valores) ? serie.valores : []);
            return {
                sets: legado ? 1 : String(serie && serie.sets !== undefined ? serie.sets : 1),
                valores: secoes.map((_, i) => {
                    const celula = valores[i] || {};
                    return {
                        reps: celula.reps || "",
                        intensidade: celula.intensidade || ""
                    };
                })
            };
        })
        : [];

    return { secoes, series: series.length > 0 ? series : tabela_padrao().series };
}

function filtrar_numero_tabela(input, inteiro = false) {
    let valor = input.value.replace(inteiro ? /[^0-9]/g : /[^0-9.]/g, "");
    if (!inteiro) {
        const ponto = valor.indexOf(".");
        if (ponto !== -1) valor = valor.slice(0, ponto + 1) + valor.slice(ponto + 1).replace(/\./g, "");
    }
    input.value = valor;
}

function criar_input_tabela(classe, valor) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 10;
    input.classList.add(classe);
    input.value = valor || "";
    input.inputMode = classe === "ex_cel_sets" ? "numeric" : "decimal";
    input.pattern = classe === "ex_cel_sets" ? "[0-9]+" : "[0-9]*([.][0-9]*)?";
    input.addEventListener("input", () => filtrar_numero_tabela(input, classe === "ex_cel_sets"));
    filtrar_numero_tabela(input, classe === "ex_cel_sets");
    return input;
}

// desenha a tabela a partir dos dados { secoes, series }
function construir_tabela(linha, t) {
    t = normalizar_tabela(t);
    const contentor = linha.querySelector(".ex_tabela_scroll");
    const botoes_colunas = linha.querySelector(".ex_botoes_colunas");
    contentor.innerHTML = "";
    const conteudo_tabela = document.createElement("div");
    conteudo_tabela.classList.add("ex_tabela_conteudo");

    const tabela = document.createElement("table");
    tabela.classList.add("ex_tabela");

    const thead = tabela.createTHead();
    const linha_secoes = thead.insertRow();
    const linha_campos = thead.insertRow();

    const th_secao_serie = document.createElement("th");
    th_secao_serie.rowSpan = 2;
    th_secao_serie.classList.add("ex_th_secao_serie");
    linha_secoes.appendChild(th_secao_serie);

    const th_sets = document.createElement("th");
    th_sets.rowSpan = 2;
    th_sets.classList.add("ex_th_sets");
    th_sets.textContent = "Nº of sets";
    linha_secoes.appendChild(th_sets);

    t.secoes.forEach((secao, i) => {
        const th_secao = document.createElement("th");
        th_secao.colSpan = 2;
        th_secao.textContent = `Section ${i + 1}`;
        linha_secoes.appendChild(th_secao);

        const th_reps = document.createElement("th");
        const select_tipo = document.createElement("select");
        select_tipo.classList.add("ex_tipo_serie");
        select_tipo.title = "Set type";
        TIPOS_SERIE.forEach(tipo => {
            const opcao = document.createElement("option");
            opcao.value = tipo;
            opcao.textContent = tipo;
            select_tipo.appendChild(opcao);
        });
        select_tipo.value = secao.tipo;
        th_reps.appendChild(select_tipo);
        linha_campos.appendChild(th_reps);

        const th_int = document.createElement("th");
        const select = document.createElement("select");
        select.classList.add("ex_unidade_secao");
        UNIDADES_INTENSIDADE.forEach(u => {
            const opcao = document.createElement("option");
            opcao.value = u;
            opcao.textContent = u;
            select.appendChild(opcao);
        });
        select.value = UNIDADES_INTENSIDADE.includes(secao.unidade) ? secao.unidade : UNIDADES_INTENSIDADE[0];
        th_int.appendChild(select);
        linha_campos.appendChild(th_int);
    });

    const tbody = tabela.createTBody();
    t.series.forEach((serie, n) => {
        const tr = tbody.insertRow();
        const th_secao = document.createElement("th");
        th_secao.classList.add("ex_th_secao_serie");
        const rotulo_secao = document.createElement("span");
        rotulo_secao.classList.add("ex_rotulo_secao_serie");
        rotulo_secao.textContent = `Section ${n + 1}`;
        th_secao.appendChild(rotulo_secao);
        tr.appendChild(th_secao);

        const td_sets = tr.insertCell();
        td_sets.appendChild(criar_input_tabela("ex_cel_sets", serie.sets));
        const input_sets = td_sets.querySelector(".ex_cel_sets");
        input_sets.required = true;

        t.secoes.forEach((_, i) => {
            const celula = serie.valores[i] || celula_vazia();
            const td_reps = tr.insertCell();
            td_reps.classList.add("ex_cel_valor_serie");
            const input_reps = criar_input_tabela("ex_cel_reps", celula.reps);
            td_reps.appendChild(input_reps);
            const sufixo = document.createElement("span");
            sufixo.classList.add("ex_sufixo_serie");
            sufixo.hidden = !input_reps.value.trim();
            input_reps.addEventListener("input", () => {
                sufixo.hidden = !input_reps.value.trim();
            });
            td_reps.appendChild(sufixo);
            tr.insertCell().appendChild(criar_input_tabela("ex_cel_int", celula.intensidade));
        });
    });

    conteudo_tabela.appendChild(tabela);
    if (botoes_colunas) conteudo_tabela.appendChild(botoes_colunas);
    contentor.appendChild(conteudo_tabela);
    contentor.querySelectorAll(".ex_tipo_serie").forEach(select => {
        select.addEventListener("change", () => {
            const indice = [...contentor.querySelectorAll(".ex_tipo_serie")].indexOf(select);
            const sufixo = sufixo_tipo_serie(select.value);
            contentor.querySelectorAll("tbody tr").forEach(tr => {
                const celula = tr.querySelectorAll(".ex_cel_valor_serie")[indice];
                const valor = celula.querySelector(".ex_cel_reps");
                const rotulo = celula.querySelector(".ex_sufixo_serie");
                rotulo.textContent = sufixo;
                rotulo.hidden = !valor.value.trim();
            });
        });
    });

    // não deixa ficar sem nenhuma série ou secção
    const botao_mais_secao = linha.querySelector(".ex_col_mais");
    const botao_menos_secao = linha.querySelector(".ex_col_menos");
    const botao_mais_serie = linha.querySelector(".ex_lin_mais");
    const botao_menos_serie = linha.querySelector(".ex_lin_menos");
    if (botao_mais_secao) botao_mais_secao.disabled = t.secoes.length >= MAX_SECOES_TABELA;
    if (botao_menos_secao) botao_menos_secao.disabled = t.secoes.length <= 1;
    if (botao_mais_serie) botao_mais_serie.disabled = t.series.length >= MAX_SERIES_TABELA;
    if (botao_menos_serie) botao_menos_serie.disabled = t.series.length <= 1;

    atualizar_alerta_tabela(linha);
}

// lê os dados que estão no ecrã
function ler_tabela(linha) {
    const contentor = linha.querySelector(".ex_tabela_scroll");
    const tipos = [...contentor.querySelectorAll(".ex_tipo_serie")].map(sel => sel.value);
    const unidades = [...contentor.querySelectorAll(".ex_unidade_secao")].map(sel => sel.value);
    const secoes = tipos.map((tipo, i) => ({ tipo, unidade: unidades[i] }));

    const series = [...contentor.querySelectorAll("tbody tr")].map(tr => {
        const sets = tr.querySelector(".ex_cel_sets");
        const reps = tr.querySelectorAll(".ex_cel_reps");
        const ints = tr.querySelectorAll(".ex_cel_int");
        return {
            sets: Number(sets.value),
            valores: secoes.map((_, i) => ({ reps: reps[i].value, intensidade: ints[i].value }))
        };
    });

    return { secoes, series };
}

// botões + e - : "mais_secao", "menos_secao", "mais_serie", "menos_serie"
function alterar_tabela(linha, acao) {
    const t = ler_tabela(linha); // os valores já escritos mantêm-se

    if (acao === "mais_secao" && t.secoes.length < MAX_SECOES_TABELA) {
        t.secoes.push({
            tipo: t.secoes[t.secoes.length - 1].tipo,
            unidade: t.secoes[t.secoes.length - 1].unidade
        }); // a nova secção começa com as unidades da anterior
        t.series.forEach(serie => serie.valores.push(celula_vazia()));
    } else if (acao === "menos_secao" && t.secoes.length > 1) {
        t.secoes.pop();
        t.series.forEach(serie => serie.valores.pop());
    } else if (acao === "mais_serie" && t.series.length < MAX_SERIES_TABELA) {
        t.series.push({ sets: 1, valores: t.secoes.map(celula_vazia) });
    } else if (acao === "menos_serie" && t.series.length > 1) {
        t.series.pop();
    }

    construir_tabela(linha, t);
}

// tabela "completamente vazia": nenhuma célula de reps nem de intensidade preenchida (as unidades não contam)
function tabela_incompleta(tabela) {
    const t = normalizar_tabela(tabela);
    return t.series.some(serie =>
        serie.valores.some(c => !String(c.reps || "").trim() || !String(c.intensidade || "").trim())
    );
}

// Guarded exercises show the warning whenever any reps or intensity cell is missing.
function exercicio_com_tabela_vazia(ex) {
    if (ex.tabela) return tabela_incompleta(ex.tabela);
    return tabela_incompleta(tabela_a_partir_de_antigo(ex));
}

// mostra ou esconde o "!" à frente do nome do exercício, na caixa de edição
function atualizar_alerta_tabela(linha) {
    const incompleta = tabela_incompleta(ler_tabela(linha));
    const alerta = linha.querySelector(".ex_alerta");
    alerta.style.display = incompleta ? "inline-flex" : "none";
    alerta.title = incompleta ? "The sets table has empty fields" : "";
}

// texto curto da tabela para a célula do calendário: "3x 8 @ 80 Kg + 6 @ 60 Kg"
function resumo_tabela(tabela) {
    const t = normalizar_tabela(tabela);

    const formatar = (valor, unidade) => !valor ? "" : (unidade === "%" ? `${valor}%` : `${valor} ${unidade}`);

    const grupos = [];
    t.series.forEach(serie => {
        const valores = serie.valores.map(celula => [celula.reps, celula.intensidade]);
        const assinatura = JSON.stringify(valores);
        const anterior = grupos[grupos.length - 1];
        if (anterior && anterior.assinatura === assinatura) {
            anterior.sets += parseInt(serie.sets, 10) || 0;
        } else {
            grupos.push({
                assinatura,
                sets: parseInt(serie.sets, 10) || 0,
                valores: serie.valores
            });
        }
    });

    const partes_grupos = grupos.map(grupo => {
        const partes = t.secoes.map((secao, i) => {
            const celula = grupo.valores[i] || celula_vazia();
            const intensidade = formatar(celula.intensidade, secao.unidade);
            const reps = celula.reps && `${celula.reps} ${sufixo_tipo_serie(secao.tipo)}`;
            return [reps, intensidade && `@ ${intensidade}`].filter(Boolean).join(" ");
        }).filter(Boolean);
        return partes.length > 0 ? `${grupo.sets}x ${partes.join(" + ")}` : "";
    }).filter(Boolean);

    return partes_grupos.length > 0
        ? partes_grupos.join(" | ")
        : `${t.series.reduce((total, serie) => total + (parseInt(serie.sets, 10) || 0), 0)} sets`;
}

/* ---------- "Save to dictionary": abre o Dictionary of exercises e volta ao treino ---------- */

let retorno_para_edicao = null; // { id_caixa } enquanto o dicionário está aberto a partir de um exercício

function guardar_no_dicionario(linha) {
    const ex = linha._exercicio;
    if (!ex || !ex.nome) return;

    retorno_para_edicao = { id_caixa: linha.id };

    // esconde a tela de edição (o que já escreveste fica em memória) e abre o dicionário
    abrir_dicionario_exercicios();
    document.getElementById("botão_menu").style.display = "block";

    // formulário "Add exercise" aberto, com o nome já preenchido
    limpar_formulario_exercicio();
    alternar_form_exercicio(true);
    document.getElementById("campo_ex_nome").value = ex.nome;

}

// volta à tela de edição do treino; se o exercício foi criado, a caixa passa a usar essa entrada do dicionário
function voltar_a_edicao_do_treino(retorno, novo_exercicio = null) {
    document.getElementById("botão_menu").style.display = "none";
    document.getElementById("tela_editar_treino").style.display = "block";

    const linha = document.getElementById(retorno.id_caixa);
    if (!linha) return;

    if (novo_exercicio) {
        linha._exercicio = {
            nome: novo_exercicio.nome,
            categoria: novo_exercicio.categoria || "",
            musculo: musculo_do_exercicio(novo_exercicio)
        };
        mostrar_exercicio_escolhido(linha);
    }
    if (linha.scrollIntoView) linha.scrollIntoView({ block: "nearest" });
}

// enquanto estamos a meio de um "Save to dictionary", fechar o dicionário volta ao treino (em vez de ir para o calendário)
if (typeof fechar_dicionario_exercicios === "function" && typeof guardar_exercicio_dicionario === "function") {
    const fechar_dicionario_original = fechar_dicionario_exercicios;
    const guardar_exercicio_original = guardar_exercicio_dicionario;

    window.fechar_dicionario_exercicios = function(voltar_ao_calendario = false) {
        if (retorno_para_edicao) {
            const retorno = retorno_para_edicao;
            retorno_para_edicao = null;
            fechar_dicionario_original(false);   // fecha e limpa o formulário
            voltar_a_edicao_do_treino(retorno);
            return;
        }
        fechar_dicionario_original(voltar_ao_calendario);
    };

    window.guardar_exercicio_dicionario = function() {
        const total_antes = exercicios_do_dicionario().length;
        guardar_exercicio_original();

        if (!retorno_para_edicao) return;

        const lista = exercicios_do_dicionario();
        if (lista.length > total_antes) { // exercício novo criado (se houve erros de validação, fica no formulário)
            const novo = lista.reduce((a, b) => ((b.id || 0) > (a.id || 0) ? b : a));
            const retorno = retorno_para_edicao;
            retorno_para_edicao = null;
            fechar_dicionario_original(false);
            voltar_a_edicao_do_treino(retorno, novo);
        }
    };
}

/* ---------- caixa de um exercício (botão "Add exercise") ---------- */

function adicionar_exercicio(rolar = true, dados = null) {
    contador_exercicios++;
    const id = contador_exercicios;
    const lista = document.getElementById("lista_exercicios");

    const linha = document.createElement("div");
    linha.classList.add("linha_exercicio");
    linha.id = `exercicio_${id}`;

    linha.innerHTML = `
        <div class="ex_topo">
            <input type="checkbox" class="ex_agrupar_selecao" aria-label="Select exercise to group">
            <span class="ex_ponto_ligacao" aria-hidden="true"></span>
            <button type="button" class="ex_numero" aria-label="Exercise information" title="Exercise information" onclick="abrir_info_exercicio(${id})" disabled>${id}</button>
            <span class="ex_alerta" title="The sets table is empty">!</span>
            <span class="ex_selecionado"></span>
            <button class="ex_botao_dicionario" title="Define this exercise in the Dictionary of exercises">Save to dictionary</button>
        </div>

        <div class="ex_coluna_esquerda">
            <div class="ex_busca">
                <label>Search exercise</label>
                <input type="text" class="ex_input_busca" placeholder="Search by name...">
                <div class="ex_busca_filtros">
                    <button type="button" class="ex_filtros_exercicio" onclick="abrir_modal_filtros_exercicio(this.closest('.linha_exercicio'))">Categories and Muscles</button>
                </div>
                <div class="ex_sugestoes"></div>
            </div>

            <div class="ex_rm">
                <label>Stipulated daily RM</label>
                <input type="text" inputmode="decimal" class="ex_rm_valor" placeholder="number">
                <select class="ex_rm_unidade" title="Unit of measure"></select>
            </div>
        </div>

        <div class="ex_area_tabela">
            <div class="ex_tabela_scroll"></div>
            <div class="ex_botoes_colunas">
                <button class="ex_botao_tabela ex_col_mais" title="Add section">+</button>
                <button class="ex_botao_tabela ex_col_menos" title="Remove last section">&minus;</button>
            </div>
            <div class="ex_botoes_linhas">
                <button class="ex_botao_tabela ex_lin_mais" title="Add set section">+</button>
                <button class="ex_botao_tabela ex_lin_menos" title="Remove last set section">&minus;</button>
            </div>
        </div>

        <div class="ex_detalhes_execucao">
            <label class="ex_label_detalhes">Execution details:</label>
            <textarea class="ex_textarea" maxlength="${MAX_CARACTERES_DETALHES}" placeholder="How the exercise should be executed..."></textarea>
            <div class="ex_contador">0/${MAX_CARACTERES_DETALHES}</div>
        </div>

        <div class="ex_acoes">
            <button class="ex_botao_mover" title="Move up" onclick="mover_exercicio(${id}, 'cima')">&#9650;</button>
            <button class="ex_botao_mover" title="Move down" onclick="mover_exercicio(${id}, 'baixo')">&#9660;</button>
            <button class="ex_botao_remover" onclick="remover_exercicio(${id})">Remove</button>
        </div>
    `;

    // dados de um treino já guardado (ou vazio, se for exercício novo)
    linha._legado = dados || {};   // guarda tudo o que já existia (sets, reps, ...) para não se perder ao guardar
    linha._filtrosCategoria = new Set();
    linha._filtrosMusculo = new Set();
    const ligacoes_anteriores = dados && Array.isArray(dados.grupos_ligacao)
        ? dados.grupos_ligacao
        : dados && dados.grupo_agrupamento ? [String(dados.grupo_agrupamento)] : [];
    linha._linksAgrupamento = [...new Set(ligacoes_anteriores.map(String))];
    linha._exercicio = null;       // exercício escolhido no dicionário: { nome, categoria, musculo }
    linha.querySelector(".ex_numero").onclick = () => abrir_info_exercicio(id);
    linha.querySelector(".ex_agrupar_selecao").addEventListener("change", atualizar_botao_agrupamento);
    const textarea = linha.querySelector(".ex_textarea");

    if (dados) {
        const escolhido = {
            nome: dados.nome || "",
            categoria: dados.categoria || "",
            musculo: dados.musculo || ""
        };
        if (escolhido.nome && (!escolhido.categoria || !escolhido.musculo)) {
            const no_dicionario = exercicios_do_dicionario().find(e => normalizar_texto(e.nome) === normalizar_texto(escolhido.nome));
            if (no_dicionario) {
                escolhido.categoria = escolhido.categoria || no_dicionario.categoria || "";
                escolhido.musculo = escolhido.musculo || musculo_do_exercicio(no_dicionario);
            }
        }
        linha._exercicio = escolhido.nome ? escolhido : null;
        textarea.value = dados.detalhes !== undefined ? dados.detalhes : (dados.notas || ""); // as notas antigas passam a "detalhes"
    }

    const contador = linha.querySelector(".ex_contador");
    const atualizar_contador = () => { contador.textContent = `${textarea.value.length}/${MAX_CARACTERES_DETALHES}`; };
    textarea.addEventListener("input", atualizar_contador);
    atualizar_contador();

    // stipulated daily RM: só números + unidade (as mesmas do dicionário)
    const rm_valor = linha.querySelector(".ex_rm_valor");
    const rm_unidade = linha.querySelector(".ex_rm_unidade");
    unidades_de_medida().forEach(u => {
        const opcao = document.createElement("option");
        opcao.value = u;
        opcao.textContent = u;
        rm_unidade.appendChild(opcao);
    });
    rm_valor.addEventListener("input", () => so_numeros(rm_valor));
    if (dados) {
        rm_valor.value = dados.rm_diario || "";
        if (dados.rm_unidade) rm_unidade.value = dados.rm_unidade;
        so_numeros(rm_valor);
    }

    // tabela de séries
    construir_tabela(linha, dados && dados.tabela ? dados.tabela : (dados ? tabela_a_partir_de_antigo(dados) : tabela_padrao()));
    linha.querySelector(".ex_tabela_scroll").addEventListener("input", () => atualizar_alerta_tabela(linha));
    linha.querySelector(".ex_col_mais").onclick = () => alterar_tabela(linha, "mais_secao");
    linha.querySelector(".ex_col_menos").onclick = () => alterar_tabela(linha, "menos_secao");
    linha.querySelector(".ex_lin_mais").onclick = () => alterar_tabela(linha, "mais_serie");
    linha.querySelector(".ex_lin_menos").onclick = () => alterar_tabela(linha, "menos_serie");

    const input_busca = linha.querySelector(".ex_input_busca");
    input_busca.addEventListener("input", () => atualizar_sugestoes(linha));
    atualizar_rotulo_filtros_treino(linha);

    linha.querySelector(".ex_botao_dicionario").onclick = () => guardar_no_dicionario(linha);

    mostrar_exercicio_escolhido(linha);
    atualizar_sugestoes(linha);

    lista.appendChild(linha);
    renumerar_exercicios();
    atualizar_botao_agrupamento();

    // ao clicar em "Add exercise" a lista desce até ao último exercício (ao carregar um treino guardado não rola)
    if (rolar) {
        lista.scrollTop = lista.scrollHeight;
        input_busca.focus({ preventScroll: true });
    }
}

/* intensidade: valor (input) + tipo (select: %, RIR, RPE) */

// devolve { valor, tipo } para preencher os campos ao editar
function ler_intensidade(ex) {
    const bruto = (ex.intensity || "").trim();
    if (ex.intensity_tipo) return { valor: bruto, tipo: ex.intensity_tipo };

    // compatibilidade: treinos guardados antes do select, em que a intensidade era texto livre (ex: "90%", "RPE 8")
    const tipo = /rir/i.test(bruto) ? "RIR" : /rpe/i.test(bruto) ? "RPE" : "%";
    const valor = bruto.replace(/rir|rpe|%|@/ig, "").trim();
    return { valor, tipo };
}

// devolve o texto para mostrar: "90%", "2 RIR", "8 RPE"
function formatar_intensidade(ex) {
    if (!ex.intensity_tipo) return ex.intensity || ""; // treinos antigos: mostra o texto como estava
    if (!ex.intensity) return "";
    return ex.intensity_tipo === "%" ? `${ex.intensity}%` : `${ex.intensity} ${ex.intensity_tipo}`;
}

function remover_exercicio(id) {
    const linha = document.getElementById(`exercicio_${id}`);
    if (linha) linha.remove();
    limpar_ligacoes_exercicios_obsoletas();
    atualizar_botao_agrupamento();
    renumerar_exercicios();
}

function abrir_notas_dia(dia, mes, ano) {
    dia_notas_atual = dia;
    mes_notas_atual = mes;
    ano_notas_atual = ano;

    const chave = chave_treino(dia, mes, ano);
    const nota_existente = notas_dia[chave];

    document.getElementById("texto_titulo_notas_dia").textContent =
        `Notes for ${dia}/${mes}/${ano}`;
    document.getElementById("campo_notas_dia").value = nota_existente ? nota_existente.notas : "";

    document.getElementById("tela_notas_dia").style.display = "flex";
}

function guardar_notas_dia() {
    const chave = chave_treino(dia_notas_atual, mes_notas_atual, ano_notas_atual);
    const texto = document.getElementById("campo_notas_dia").value;

    notas_dia[chave] = { notas: texto };
    localStorage.setItem("notas_dia", JSON.stringify(notas_dia));

    fechar_notas_dia();
}

function fechar_notas_dia() {
    document.getElementById("tela_notas_dia").style.display = "none";
    dia_notas_atual = mes_notas_atual = ano_notas_atual = null;
    regenerar_calendario();
}

function guardar_treino() {
    const container = document.getElementById("lista_exercicios");
    const separadores = [...container.querySelectorAll(".linha_separador")];
    if (separadores.length === 0) {
        alert("Add a named workout section with the Separate button before saving.");
        document.getElementById("botao_separar").focus();
        return;
    }
    for (const separador of separadores) {
        const input_nome = separador.querySelector(".input_nome_sep");
        if (!input_nome.value.trim()) {
            alert("Enter a name for each workout section before saving.");
            input_nome.focus();
            return;
        }
    }

    for (const linha of container.querySelectorAll(".linha_exercicio")) {
        for (const input_sets of linha.querySelectorAll(".ex_cel_sets")) {
            if (!input_sets.checkValidity() || !Number.isSafeInteger(Number(input_sets.value)) || Number(input_sets.value) < 1) {
                alert("Each set section must have a whole number of sets greater than 0.");
                input_sets.focus();
                return;
            }
        }
    }

    const exercicios = [];
    container.querySelectorAll(".linha_exercicio, .linha_separador").forEach(linha => {
        if (linha.classList.contains("linha_separador")) {
            exercicios.push({
                separador: true,
                nome: linha.querySelector(".input_nome_sep").value.trim(),
                horas: linha.querySelector(".input_horas_sep").value,
                minutos: linha.querySelector(".input_minutos_sep").value
            });
            return;
        }
        const escolhido = linha._exercicio || { nome: "", categoria: "", musculo: "" };
        // sets, reps e intensity antigos já foram convertidos para a tabela, por isso não se guardam outra vez
        const { sets, reps, intensity, intensity_tipo, grupo_agrupamento, grupos_ligacao, ...legado } = linha._legado;
        exercicios.push({
            ...legado, // o que mais existia (pb, notas...) mantém-se
            grupos_ligacao: [...linha._linksAgrupamento],
            nome: escolhido.nome,
            categoria: escolhido.categoria,
            musculo: escolhido.musculo,
            detalhes: linha.querySelector(".ex_textarea").value,
            rm_diario: linha.querySelector(".ex_rm_valor").value,
            rm_unidade: linha.querySelector(".ex_rm_unidade").value,
            tabela: ler_tabela(linha)
        });
    });

    const chave = chave_treino(dia_atual, mes_atual, ano_atual);
    if (!treinos[chave]) treinos[chave] = [];
    const nome = [...new Set(separadores.map(separador => separador.querySelector(".input_nome_sep").value.trim()))].join(" / ");

    if (treino_em_edicao === null) {
        treinos[chave].push({
            id: proximo_id_treino++,
            nome,
            exercicios,
            autoavaliacao: document.getElementById("autoavaliacao_treino").value || null
        });
    } else {
        const treino = treinos[chave].find(t => t.id === treino_em_edicao);
        treino.nome = nome;
        treino.exercicios = exercicios;
        treino.autoavaliacao = document.getElementById("autoavaliacao_treino").value || null;
    }

    localStorage.setItem("treinos", JSON.stringify(treinos));
    treino_em_edicao = null; // reset defensivo, evita estado preso entre sessões
    fechar_tela_editar_treino();
}

function disponivel_autoavaliacao(dia, mes, ano, agora = new Date()) {
    const data_treino = new Date(ano, mes - 1, dia);
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    if (data_treino < hoje) return true;

    return data_treino.getTime() === hoje.getTime() && agora.getHours() >= 23;
}

function atualizar_disponibilidade_autoavaliacao() {
    document.getElementById("campo_autoavaliacao_treino").hidden =
        !disponivel_autoavaliacao(dia_atual, mes_atual, ano_atual);
}

function agendar_atualizacao_autoavaliacao() {
    clearTimeout(temporizador_autoavaliacao);
    const agora = new Date();
    const hora_disponibilidade = new Date(ano_atual, mes_atual - 1, dia_atual, 23);
    const data_treino = new Date(ano_atual, mes_atual - 1, dia_atual);
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    if (data_treino >= hoje && hora_disponibilidade > agora) {
        temporizador_autoavaliacao = setTimeout(() => {
            atualizar_disponibilidade_autoavaliacao();
            agendar_atualizacao_autoavaliacao();
        }, Math.min(hora_disponibilidade - agora, 2147483647));
    }
}

function inicializar_autoavaliacao() {
    const select = document.getElementById("autoavaliacao_treino");
    for (let nota = 50; nota <= 100; nota++) {
        const opcao = document.createElement("option");
        opcao.value = String(nota);
        opcao.textContent = String(nota);
        select.appendChild(opcao);
    }
}

function abrir_confirmacao_limpar_treino() {
    const modal = document.getElementById("modal_limpar_treino");
    modal.style.display = "flex";
    document.getElementById("cancelar_limpar_treino").focus();
}

function fechar_confirmacao_limpar_treino(restaurar_foco = false) {
    const modal = document.getElementById("modal_limpar_treino");
    if (modal) modal.style.display = "none";
    if (restaurar_foco) document.getElementById("botao_limpar_treino").focus();
}

function confirmar_limpar_treino() {
    const chave = chave_treino(dia_atual, mes_atual, ano_atual);

    if (treino_em_edicao !== null) {
        const treinos_atualizados = { ...treinos };
        const restantes = (treinos[chave] || []).filter(treino => treino.id !== treino_em_edicao);
        if (restantes.length > 0) {
            treinos_atualizados[chave] = restantes;
        } else {
            delete treinos_atualizados[chave];
        }

        try {
            localStorage.setItem("treinos", JSON.stringify(treinos_atualizados));
        } catch (erro) {
            console.error("Unable to clear the workout from browser storage:", erro);
            alert("Could not clear the workout. Check browser storage space and permissions.");
            return;
        }

        if (restantes.length > 0) {
            treinos[chave] = restantes;
        } else {
            delete treinos[chave];
        }
    }

    document.getElementById("lista_exercicios").replaceChildren();
    contador_exercicios = 0;
    contador_separadores = 0;
    fechar_confirmacao_limpar_treino();
    fechar_tela_editar_treino();
}

(function ligar_modal_limpar_treino() {
    const modal = document.getElementById("modal_limpar_treino");
    if (!modal) return;

    modal.addEventListener("click", event => {
        if (event.target === modal) fechar_confirmacao_limpar_treino(true);
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modal.style.display === "flex") {
            fechar_confirmacao_limpar_treino(true);
        }
    });
})();

/* função para abrir a tela de slecionar horas e guardá-las */

function slecionar_horas(id_separador) {
    separador_em_edicao = id_separador;
    document.getElementById("tela_horas").style.display = "flex";  

    const select_horas = document.getElementById("horas");
    const select_minutos = document.getElementById("minutos");

    // limpa sempre antes de gerar, para não duplicar em reaberturas
    select_horas.innerHTML = `<option value="" selected disabled>Hours</option>`;
    select_minutos.innerHTML = `<option value="" selected disabled>Minutes</option>`;

    for (let i = 0; i <= 23; i++) {
        const h = String(i).padStart(2, "0");
        select_horas.innerHTML += `<option value="${h}">${h}</option>`;
    }
    for (let i = 0; i <= 55; i += 5) {
        const m = String(i).padStart(2, "0");
        select_minutos.innerHTML += `<option value="${m}">${m}</option>`;
    }

    // se já havia uma hora escolhida antes, repõe a seleção
    const linha_sep = document.getElementById(`separador_${id_separador}`);
    const h_guardada = linha_sep.querySelector(".input_horas_sep").value;
    const m_guardado = linha_sep.querySelector(".input_minutos_sep").value;
    if (h_guardada) select_horas.value = h_guardada;
    if (m_guardado) select_minutos.value = m_guardado;
}

function confirmar_horas() {
    const horas = document.getElementById("horas").value;
    const minutos = document.getElementById("minutos").value;

    if (!horas || !minutos) {
        alert("Seleciona a hora e os minutos antes de confirmar.");
        return;
    }

    // é aqui que "recebes" o valor: .value do select, guardado nos hidden inputs do separador
    const linha_sep = document.getElementById(`separador_${separador_em_edicao}`);
    if (linha_sep) {
        linha_sep.querySelector(".input_horas_sep").value = horas;
        linha_sep.querySelector(".input_minutos_sep").value = minutos;
        linha_sep.querySelector(".botao_hora_separador").textContent = `Time: ${horas}:${minutos}`;
    }

    fechar_tela_horas();
}

function fechar_tela_horas() {
    separador_em_edicao = null;
    document.getElementById("tela_horas").style.display = "none"; 
}

function calcular_num_dia_no_mes(mes){
    let num_dias_no_mes;
    switch(mes){
        case 1: num_dias_no_mes = 31; break;
        case 2: num_dias_no_mes = ano % 4 === 0 ? 29 : 28; break;
        case 3: num_dias_no_mes = 31; break;
        case 4: num_dias_no_mes = 30; break;
        case 5: num_dias_no_mes = 31; break;
        case 6: num_dias_no_mes = 30; break;
        case 7: num_dias_no_mes = 31; break;
        case 8: num_dias_no_mes = 31; break;
        case 9: num_dias_no_mes = 30; break; 
        case 10: num_dias_no_mes = 31; break;
        case 11: num_dias_no_mes = 30; break;
        case 12: num_dias_no_mes = 31; break;
    }
    return num_dias_no_mes;
}

/* resumo do treino dentro da célula do dia (com scroll vertical quando não cabe tudo) */
function criar_preview_treino(treino) {
    const preview = document.createElement('div');
    preview.classList.add('preview_treino');

    const tem_nomes_nas_secoes = treino.exercicios.some(ex => ex.separador && ex.nome);
    if (!tem_nomes_nas_secoes && treino.nome) {
        const titulo = document.createElement('div');
        titulo.classList.add('preview_titulo');
        titulo.textContent = treino.nome;
        titulo.title = treino.nome;
        preview.appendChild(titulo);
    }

    treino.exercicios.forEach(ex => {
        const linha = document.createElement('div');

        if (ex.separador) {
            linha.classList.add('preview_separador');
            if (ex.nome) {
                const nome = document.createElement('span');
                nome.classList.add("preview_nome_secao");
                nome.textContent = ex.nome;
                linha.appendChild(nome);
            }
            const hora = document.createElement('span');
            hora.textContent = `${ex.horas || HORA_PADRAO}:${ex.minutos || MINUTOS_PADRAO}`;
            linha.insertAdjacentHTML('afterbegin', '<span class="traco_preview"></span>');
            linha.appendChild(hora);
            linha.insertAdjacentHTML('beforeend', '<span class="traco_preview"></span>');
        } else {
            linha.classList.add('preview_exercicio');

            const nome = document.createElement('span');
            nome.classList.add('preview_nome');
            nome.textContent = ex.nome || "-";

            const partes = [];
            if (ex.tabela) {
                const resumo = resumo_tabela(ex.tabela);
                if (resumo) partes.push(resumo);
            } else { // exercícios antigos, ainda sem tabela
                if (ex.sets || ex.reps) partes.push(`${ex.sets || "-"}x${ex.reps || "-"}`);
                const intensidade = formatar_intensidade(ex);
                if (intensidade) partes.push(`@ ${intensidade}`);
            }

            // na célula só aparece o nome; sets, reps e intensidade ficam apenas no tooltip (ao passar o rato)
            const tooltip = [`${ex.nome || "-"}  ${partes.join(" ")}`];
            if (ex.pb) tooltip.push(`PB: ${ex.pb}`);
            if (ex.rm_diario) tooltip.push(`RM: ${ex.rm_diario} ${ex.rm_unidade || ""}`.trim());
            linha.title = tooltip.join("   ");

            if (exercicio_com_tabela_vazia(ex)) {
                const alerta = document.createElement("span");
                alerta.classList.add("preview_alerta");
                alerta.textContent = "!";
                alerta.title = "The sets table has empty fields";
                linha.appendChild(alerta);
            }
            linha.appendChild(nome);
        }

        preview.appendChild(linha);
    });

    return preview;
}

function gerar_calendário() {
    const mes_anterior = mes === 1 ? 12 : mes - 1;
    let num_dias_no_mes = calcular_num_dia_no_mes(mes);
    let num_dias_no_mes_anterior = calcular_num_dia_no_mes(mes_anterior);

    const calendario = document.getElementById('calendario');

    const primeiroDia = new Date(ano, mes - 1, 1);
    var num_dia_sem = primeiroDia.getDay(); // 0 = Domingo ... 6 = Sábado
    num_dia_sem = (num_dia_sem + 6) % 7 + 1; // converte para 1 = Segunda ... 7 = Domingo

    for (let i = 0; i < 7; i++) {
        const dia = document.createElement('div');
        dia.classList.add('dia_semana'); // classe própria: o tamanho destas células não depende de .dia
        dia.textContent = dias_semana[i]; // aqui depois pode-se calcular o dia real do mês
        calendario.appendChild(dia);
    }

    let coluna = 0;
    for (let i = num_dia_sem; i > 1; i--) {
            const dia = document.createElement('div');
            dia.classList.add('dia');
            dia.textContent = num_dias_no_mes_anterior - i + 2;
            dia.style.color = "gray";
            calendario.appendChild(dia);
            coluna = (coluna + 1) % 7;
    } 


    /////////////////////////////////////// cilco do mes atual

    for (let i = 1; i <= num_dias_no_mes; i++) {
        const dia = document.createElement('div');
        dia.classList.add('dia');

        const topo_dia = document.createElement("div");
        topo_dia.classList.add("topo_dia");
        const botao_notas_dia = document.createElement('button');
        botao_notas_dia.classList.add('botao_notas_cal');
        botao_notas_dia.textContent = "notas";
        const numero_dia = document.createElement("span");
        numero_dia.classList.add("numero_dia");
        numero_dia.textContent = i;
        topo_dia.append(botao_notas_dia, numero_dia);
        dia.appendChild(topo_dia);

        const chave = chave_treino(i, mes, ano);
        const lista_treinos = treinos[chave] || [];

        // a própria célula é o botão que abre o treino do dia
        dia.classList.add('dia_clicavel');
        dia.setAttribute('role', 'button');
        dia.tabIndex = 0;
        dia.onclick = function() {
            abrir_dia(i, mes, ano);
        };
        dia.onkeydown = function(e) {
            if (e.target === dia && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                abrir_dia(i, mes, ano);
            }
        };

        botao_notas_dia.onclick = function(e) {
            e.stopPropagation(); // não deixa o clique "subir" para a célula do dia
            abrir_notas_dia(i, mes, ano);
            fechar_calendario();
        };

        if (lista_treinos.length > 0) {
            dia.appendChild(criar_preview_treino(lista_treinos[0])); // resumo do treino dentro da célula
        }
        calendario.appendChild(dia);

        coluna = (coluna + 1) % 7;

        const nota_dia = notas_dia[chave_treino(i, mes, ano)];
        if (nota_dia && nota_dia.notas.trim().length > 0) {
            botao_notas_dia.style.color = "green";
        } 
    }

    ///////////////////////////////////////

    for (let i = 0; i < coluna; i++) {
        const dia = document.createElement('div');
            dia.classList.add('dia');
            dia.textContent = i + 1;
            dia.style.color = "gray";
            calendario.appendChild(dia);
            coluna = (coluna + 1) % 7;
    }
}

function abrir_calendario() {
    // A navigation away from the dictionary ends the temporary return-to-workout flow.
    retorno_para_edicao = null;
    if (typeof fechar_dicionario_exercicios === "function") {
        fechar_dicionario_exercicios();
    }
    mes = hoje.getMonth() + 1; 
    ano = hoje.getFullYear();

    regenerar_calendario();

    mostrar_acessorios_de_calendario()
}

function mudar_mes(op) {
    if (op === "+") {
        mes++;
    } else {
        mes--;
    }

    // normalizar mes fora do intervalo 1-12
    if (mes > 12) {
        mes = 1;
        ano++;
    } else if (mes < 1) {
        mes = 12;
        ano--;
    }

    regenerar_calendario();
}

function regenerar_calendario() {
    const calendario = document.getElementById('calendario');
    calendario.innerHTML = ""; // limpa tudo antes de gerar de novo
    gerar_calendário();

    atualizar_titulo_calendario();
    calendario.style.display = "grid";
    mostrar_acessorios_de_calendario()
}

function atualizar_titulo_calendario() {
    const titulo = document.getElementById("titulo_calendario");
    titulo.textContent = `${nomes_meses[mes - 1]} ${ano}`; // mes é 1-12, array é 0-11
}

function fechar_calendario() {
    const calendario = document.getElementById('calendario');
    calendario.style.display = "none";
    document.getElementById("botao_mes_anterior").style.display = "none";
    document.getElementById("botao_mes_seguinte").style.display = "none";
    const titulo = document.getElementById("titulo_calendario");
    titulo.style.display = "none";
}

function mostrar_acessorios_de_calendario() {
    document.getElementById("botao_mes_anterior").style.display = "block";
    document.getElementById("botao_mes_seguinte").style.display = "block";
    document.getElementById("titulo_calendario").style.display = "block";
}

const CHAVE_BLOCO_NOTAS = "bloco_notas_geral";
const TAGS_BLOCO_NOTAS_PERMITIDAS = new Set([
    "P", "DIV", "BR", "STRONG", "B", "EM", "I", "U", "SPAN",
    "UL", "OL", "LI", "BLOCKQUOTE", "H2", "H3", "H4", "HR"
]);
let selecao_bloco_notas = null;

function sanitizar_conteudo_bloco_notas(html) {
    const documento = new DOMParser().parseFromString(String(html || ""), "text/html");
    const elementos = [...documento.body.querySelectorAll("*")];
    const perigosos = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TEMPLATE"]);

    elementos.forEach(elemento => {
        if (perigosos.has(elemento.tagName)) {
            elemento.remove();
            return;
        }

        if (elemento.tagName === "FONT") {
            const span = documento.createElement("span");
            const cor = elemento.getAttribute("color");
            if (cor && CSS.supports("color", cor)) span.style.color = cor;
            span.replaceChildren(...elemento.childNodes);
            elemento.replaceWith(span);
            return;
        }

        if (!TAGS_BLOCO_NOTAS_PERMITIDAS.has(elemento.tagName)) {
            elemento.replaceWith(...elemento.childNodes);
            return;
        }

        const estilos = [];
        for (const regra of [...elemento.style]) {
            const valor = elemento.style.getPropertyValue(regra).trim();
            if (regra === "color" && CSS.supports("color", valor)) {
                estilos.push(`color: ${valor}`);
            } else if (regra === "font-size" && /^(?:[8-9]|[1-8][0-9]|9[0-6])px$/.test(valor)) {
                estilos.push(`font-size: ${valor}`);
            } else if (regra === "font-weight" && /^(?:normal|bold|[1-9]00)$/.test(valor)) {
                estilos.push(`font-weight: ${valor}`);
            } else if (regra === "font-style" && /^(?:normal|italic)$/.test(valor)) {
                estilos.push(`font-style: ${valor}`);
            } else if (regra === "text-decoration" && /^(?:none|underline|line-through)$/.test(valor)) {
                estilos.push(`text-decoration: ${valor}`);
            } else if (regra === "text-align" && /^(?:left|right|center|justify)$/.test(valor)) {
                estilos.push(`text-align: ${valor}`);
            }
        }

        [...elemento.attributes].forEach(atributo => elemento.removeAttribute(atributo.name));
        if (estilos.length > 0) elemento.setAttribute("style", estilos.join("; "));
    });

    return documento.body.innerHTML;
}

// caractere invisível usado para o cursor "guardar" o tamanho de letra escolhido antes de se escrever
const MARCADOR_BLOCO_NOTAS = "\u200B";

function texto_visivel_bloco_notas(editor) {
    return editor.textContent.split(MARCADOR_BLOCO_NOTAS).join("").trim();
}

function atualizar_placeholder_bloco_notas() {
    const editor = document.getElementById("bloco_notas_editor");
    const placeholder = document.getElementById("bloco_notas_placeholder");
    placeholder.hidden = texto_visivel_bloco_notas(editor).length > 0;
}

function guardar_bloco_notas() {
    const editor = document.getElementById("bloco_notas_editor");
    const estado = document.getElementById("bloco_notas_estado");
    const conteudo = sanitizar_conteudo_bloco_notas(editor.innerHTML).split(MARCADOR_BLOCO_NOTAS).join("");

    try {
        if (texto_visivel_bloco_notas(editor)) {
            localStorage.setItem(CHAVE_BLOCO_NOTAS, conteudo);
        } else {
            localStorage.removeItem(CHAVE_BLOCO_NOTAS);
        }
        estado.textContent = "Saved automatically";
        return true;
    } catch (erro) {
        console.error("Unable to save the note block in browser storage:", erro);
        estado.textContent = "Could not save notes. Check browser storage space and permissions.";
        return false;
    }
}

function abrir_bloco_notas() {
    const editor = document.getElementById("bloco_notas_editor");
    const estado = document.getElementById("bloco_notas_estado");
    try {
        editor.innerHTML = sanitizar_conteudo_bloco_notas(localStorage.getItem(CHAVE_BLOCO_NOTAS) || "");
        estado.textContent = "";
    } catch (erro) {
        console.error("Unable to load the note block from browser storage:", erro);
        editor.innerHTML = "";
        estado.textContent = "Could not load saved notes from browser storage.";
    }
    atualizar_placeholder_bloco_notas();
    selecao_bloco_notas = null; // a seleção da sessão anterior já não existe
    document.getElementById("tela_bloco_notas").style.display = "block";
    editor.focus();
    sincronizar_tamanho_bloco_notas();
}

function fechar_bloco_notas() {
    if (guardar_bloco_notas()) {
        document.getElementById("tela_bloco_notas").style.display = "none";
        document.getElementById("botao_bloco_notas").focus();
    }
}

function guardar_selecao_bloco_notas() {
    const editor = document.getElementById("bloco_notas_editor");
    const selecao = window.getSelection();
    if (!selecao || selecao.rangeCount === 0) return;

    const range = selecao.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
        selecao_bloco_notas = range.cloneRange();
    }
}

// mostra no seletor o tamanho de letra que existe na posição do cursor
function sincronizar_tamanho_bloco_notas() {
    const editor = document.getElementById("bloco_notas_editor");
    const seletor = document.getElementById("bloco_notas_tamanho");
    const selecao = window.getSelection();
    if (!editor || !seletor || !selecao || selecao.rangeCount === 0) return;

    const no = selecao.anchorNode;
    if (!no || !editor.contains(no)) return;
    const elemento = no.nodeType === Node.ELEMENT_NODE ? no : no.parentElement;
    if (!elemento) return;

    const tamanho = Math.round(parseFloat(getComputedStyle(elemento).fontSize));
    const opcao = [...seletor.options].find(o => Number(o.value) === tamanho);
    // sem opção igual, o seletor fica em branco: assim qualquer escolha dispara o evento "change"
    seletor.value = opcao ? opcao.value : "";
}

function aplicar_tamanho_letra_bloco_notas(editor, selecao, tamanho) {
    if (!selecao || !Number.isFinite(tamanho) || tamanho < 8 || tamanho > 96) return;

    let range = selecao.rangeCount > 0 ? selecao.getRangeAt(0) : null;
    if (!range || !editor.contains(range.commonAncestorContainer)) {
        // sem cursor válido dentro do editor: usa o fim do texto
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selecao.removeAllRanges();
        selecao.addRange(range);
    }

    const nova_selecao = document.createRange();

    if (range.collapsed) {
        // Só há cursor (nada selecionado): o novo tamanho vale para o que se escrever a seguir.
        // Um <span> vazio não funciona, o navegador tira o cursor lá de dentro; por isso leva um caractere invisível.
        const no = range.startContainer;
        const pai = no.nodeType === Node.TEXT_NODE ? no.parentNode : null;
        if (pai && pai !== editor && pai.tagName === "SPAN" && no.nodeValue === MARCADOR_BLOCO_NOTAS) {
            pai.style.fontSize = `${tamanho}px`; // o marcador já existe (escolha anterior sem escrever nada)
            nova_selecao.setStart(no, 1);
        } else {
            const span = document.createElement("span");
            span.style.fontSize = `${tamanho}px`;
            const marcador = document.createTextNode(MARCADOR_BLOCO_NOTAS);
            span.appendChild(marcador);
            range.insertNode(span);
            nova_selecao.setStart(marcador, 1);
        }
        nova_selecao.collapse(true);
    } else {
        const span = document.createElement("span");
        span.style.fontSize = `${tamanho}px`;
        span.appendChild(range.extractContents());
        // tamanhos antigos dentro da seleção não podem sobrepor-se ao novo
        span.querySelectorAll("*").forEach(filho => {
            if (filho.style && filho.style.fontSize) filho.style.removeProperty("font-size");
            if (filho.tagName === "SPAN" && !filho.getAttribute("style")) filho.replaceWith(...filho.childNodes);
        });
        range.insertNode(span);
        nova_selecao.selectNodeContents(span);
    }

    selecao.removeAllRanges();
    selecao.addRange(nova_selecao);
    selecao_bloco_notas = nova_selecao.cloneRange();
    atualizar_placeholder_bloco_notas();
    guardar_bloco_notas();
    sincronizar_tamanho_bloco_notas();
}

function formatar_bloco_notas(comando, valor = null) {
    const editor = document.getElementById("bloco_notas_editor");
    // lê a seleção guardada ANTES de focar o editor: o evento "focus" grava outra por cima
    const guardada = selecao_bloco_notas;
    editor.focus();

    const selecao = window.getSelection();
    if (selecao && guardada && editor.contains(guardada.commonAncestorContainer)) {
        selecao.removeAllRanges();
        selecao.addRange(guardada);
    }

    if (comando === "fontSize") {
        aplicar_tamanho_letra_bloco_notas(editor, selecao, Number(valor));
        return;
    }

    document.execCommand(comando, false, valor);

    guardar_selecao_bloco_notas();
    atualizar_placeholder_bloco_notas();
    guardar_bloco_notas();
}

function inicializar_bloco_notas() {
    const editor = document.getElementById("bloco_notas_editor");
    const barra = document.querySelector(".bloco_notas_barra");

    editor.addEventListener("input", () => {
        atualizar_placeholder_bloco_notas();
        guardar_bloco_notas();
    });
    editor.addEventListener("keyup", guardar_selecao_bloco_notas);
    editor.addEventListener("mouseup", guardar_selecao_bloco_notas);
    editor.addEventListener("focus", guardar_selecao_bloco_notas);
    editor.addEventListener("paste", event => {
        event.preventDefault();
        const html = event.clipboardData.getData("text/html");
        const texto = event.clipboardData.getData("text/plain");
        if (html) {
            document.execCommand("insertHTML", false, sanitizar_conteudo_bloco_notas(html));
        } else {
            document.execCommand("insertText", false, texto);
        }
        guardar_selecao_bloco_notas();
        atualizar_placeholder_bloco_notas();
        guardar_bloco_notas();
    });
    editor.addEventListener("keydown", event => {
        if (event.key === "Escape") fechar_bloco_notas();
    });
    barra.addEventListener("pointerdown", guardar_selecao_bloco_notas);

    document.getElementById("bloco_notas_tamanho").addEventListener("change", event => {
        formatar_bloco_notas("fontSize", event.target.value);
    });
    document.getElementById("bloco_notas_cor").addEventListener("input", event => {
        formatar_bloco_notas("foreColor", event.target.value);
    });
    // no telemóvel, as alças de seleção não disparam mouseup/keyup: acompanha a seleção por aqui
    document.addEventListener("selectionchange", () => {
        if (document.activeElement !== editor) return;
        guardar_selecao_bloco_notas();
        sincronizar_tamanho_bloco_notas();
    });

    atualizar_placeholder_bloco_notas();
}

inicializar_autoavaliacao();
inicializar_bloco_notas();
regenerar_calendario();

const menu_principal = document.getElementById("botão_menu");
menu_principal.querySelector("button").addEventListener("click", () => {
    menu_principal.classList.toggle("menu_aberto");
    menu_principal.classList.remove("menu_fechar");
});
menu_principal.querySelectorAll(".opcoes a").forEach(link => {
    link.addEventListener("click", () => {
        menu_principal.classList.remove("menu_aberto");
        menu_principal.classList.add("menu_fechar");
    });
});