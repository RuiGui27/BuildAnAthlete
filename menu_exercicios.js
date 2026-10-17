/* ==========================================================================
   MENU_EXERCICIOS.JS - Dicionário Global de Exercícios
   Armazenamento em Base de Dados do Browser (localStorage)
   ========================================================================== */

const CHAVE_STORAGE_EXERCICIOS = "dicionario_exercicios";
const MAX_SELECAO_CATEGORIAS = 4;
const MAX_SELECAO_MUSCULOS = 7;

// Categorias definidas pelo utilizador
const CATEGORIAS_PADRAO = [
    "Strength",
    "Hipertrofy",
    "Mobility",
    "Light Cardio",
    "Intensive Cardio",
    "Jump",
    "Box Jump",
    "Power",
    "Speed",
    "Extensive Plyo",
    "Intensive Plyo",
    "Warm-up",
    "Grip"
];

// Músculos definidos pelo utilizador
const MUSCULOS_PADRAO = [
    "Uper back",
    "Lower back",
    "Lats",
    "Pectorial",
    "Biceps",
    "Triceps",
    "Forearm",
    "Abs",
    "Quads",
    "Hamstrings",
    "Calf",
    "Soleo",
    "Tibial Anterior",
    "Glutes",
    "Sholders"
];

// Listas em uso = padrão + as criadas pelo utilizador (botões "Add Category" / "Add Muscle")
const CHAVE_STORAGE_CATEGORIAS = "dicionario_categorias_extra";
const CHAVE_STORAGE_MUSCULOS = "dicionario_musculos_extra";
const CHAVE_STORAGE_CATEGORIAS_REMOVIDAS = "dicionario_categorias_removidas";   // opções padrão que o utilizador apagou
const CHAVE_STORAGE_MUSCULOS_REMOVIDOS = "dicionario_musculos_removidos";
const MAX_CARACTERES_OPCAO = 50;
const MAX_CARACTERES_NOME_EXERCICIO = 50;
const MAX_CARACTERES_LINK_EXERCICIO = 50;

let CATEGORIAS_EXERCICIOS = CATEGORIAS_PADRAO.slice();
let MUSCULOS_EXERCICIOS = MUSCULOS_PADRAO.slice();

// Unidades de medida para PR
const UNIDADES_PR = [
    "Kg",
    "Lb",
    "m/s",
    "m",
    "Km",
    "mi",
    "cm",
    "W",
    "seconds",
    "hours"
];

// Exercícios padrão para demonstração inicial se a base de dados do browser estiver vazia
const EXERCICIOS_PADRAO = [
    {
        id: 1,
        nome: "Deep back Squat (high bar)",
        categorias: ["Strength", "Hipertrofy"],
        categoria: "Strength, Hipertrofy",
        musculos: ["Quads", "Glutes", "Lower Back"],
        musculo: "Quads, Glutes, Lower Back",
        pr_valor: "",
        pr_unidade: "Kg",
        descricao: "Olympic barbell back squat with the bar resting on the trapezius (not the neck), feet shoulder-width apart, controlled descent, and maximum depth. If necessary, elevate your heels to help you achieve greater depth.",
        link: "https://www.youtube.com/watch?v=bEv6CCg2BC8"
    },
    {
        id: 2,
        nome: "Bench Press",
        categorias: ["Strength", "Hipertrofy"],
        categoria: "Strength, Hipertrofy",
        musculos: ["Pectorial", "Triceps"],
        musculo: "Pectorial, Triceps",
        pr_valor: "",
        pr_unidade: "Kg",
        descricao: "Flat barbell bench press with active scapular retraction and a brief pause at the chest. Focus on squeezing your chest rather than simply pushing the weight.",
        link: "https://www.youtube.com/watch?v=rT7DgCr-3pg"
    },
    {
        id: 3,
        nome: "Standing Box Jump (with Cm, with Arm Swing)",
        categorias: ["Box Jump", "Power"],
        categoria: "Box Jump, Power",
        musculos: ["Quads", "Calf", "Glutes"],
        musculo: "Quads, Calf, Glutes",
        pr_valor: "",
        pr_unidade: "cm",
        descricao: "Perform an explosive box jump onto a box of a height comparable to your standard standing vertical jump, ensuring a soft landing with slight knee flexion. Squat down quickly and attempt to reverse the movement as fast as possible using an arm swing.",
        link: "https://www.youtube.com/watch?v=NBY9-kTuHEk"
    },
    {
        id: 4,
        nome: "Sprint 40m",
        categorias: ["Speed", "Intensive Plyo"],
        categoria: "Speed, Intensive Plyo",
        musculos: ["Hamstrings", "Glutes", "Calf", "Quads"],
        musculo: "Hamstrings, Glutes, Calf, Quads",
        pr_valor: "",
        pr_unidade: "s",
        descricao: "Maximum straight-line acceleration measured by photocells. Focus on relaxing slightly so you don't become overly tense and lose coordination. Decelerate gradually at the end; do not brake abruptly.",
        link: "https://www.youtube.com/watch?v=6m_fjNhRhkY"
    },
    {
        id: 5,
        nome: "Bent over row (with bar)",
        categorias: ["Strength", "Hipertrofy"],
        categoria: "Strength, Hipertrofy",
        musculos: ["Uper back", "Lower back", "Forearm"],
        musculo: "Uper back, Lower back, Forearm",
        pr_valor: "",
        pr_unidade: "Kg",
        descricao: "With your knees bent, lean your torso forward at a 45-degree angle while keeping your spine straight. Pull the bar toward your abdomen—keeping it close to your legs—while contracting your back muscles, then lower it in a controlled manner. Focus on driving your elbow backward. A slight rocking of the lower back is permissible.",
        link: "https://www.youtube.com/watch?v=axoeDmW0oAY"
    },
    {
        id: 6,
        nome: "Lat pull down",
        categorias: ["Strength", "Hipertrofy"],
        categoria: "Strength, Hipertrofy",
        musculos: ["Lats", "Forearm"],
        musculo: "Lats, Forearm",
        pr_valor: "",
        pr_unidade: "Kg",
        descricao: "Seated on the bench, pull the bar toward your chest while keeping your torso slightly leaned back. Contract your back muscles at the end of the movement and return in a controlled manner. Focus on driving your elbows backward. A slight rocking of the lower back is permissible.",
        link: "https://www.youtube.com/watch?v=trZQjegcRx0"
    },
    {
        id: 7,
        nome: "Seated leg curl",
        categorias: ["Strength", "Hipertrofy"],
        categoria: "Strength, Hipertrofy",
        musculos: ["Hamstrings"],
        musculo: "Hamstrings",
        pr_valor: "",
        pr_unidade: "Kg",
        descricao: "While seated with the supports adjusted, push the pad down and back by flexing your knees. Contract the back of your thighs (a full contraction is not necessary) and slowly return to the starting position.",
        link: "https://www.youtube.com/watch?v=t9sTSr-JYSs"
    },
    {
        id: 8,
        nome: "RDL",
        categorias: ["Strength", "Hipertrofy"],
        categoria: "Strength, Hipertrofy",
        musculos: ["Hamstrings", "Glutes", "Lower Back", "Forearm"],
        musculo: "Hamstrings, Glutes, Lower Back, Forearm",
        pr_valor: "",
        pr_unidade: "Kg",
        descricao: "Hinge at your hips, pushing them back while keeping a flat back and bending your knees slightly. Lower the bar slowly and close to your legs until you feel a stretch in your hamstrings, then return.",
        link: "https://www.youtube.com/watch?v=_oyxCn2iSjU"
    },
    {
        id: 9,
        nome: "Dumbell bicep curl ",
        categorias: ["Strength", "Hipertrofy"],
        categoria: "Strength, Hipertrofy",
        musculos: ["Biceps", "Forearm"],
        musculo: "Biceps, Forearm",
        pr_valor: "",
        pr_unidade: "Kg",
        descricao: "Hold the dumbbells with your palms facing forward. Keeping your elbows fixed close to your body, flex your forearms to lift the weights in a controlled manner, while maintaining your shoulders in the same position.",
        link: "https://www.youtube.com/watch?v=XE_pHwbst04"
    }
];

// Estado global do dicionário
let lista_exercicios_global = [];
let id_exercicio_em_edicao = null;
const exercicios_selecionados_busca_tempo = new Set();
const filtros_dicionario_categorias = new Set();
const filtros_dicionario_musculos = new Set();
let treinos_resultado_busca_tempo = [];
let indice_treino_busca_tempo = 0;
let contexto_modal_filtros_exercicio = null;

// Disponibilizar globalmente para outros ficheiros e consola
window.dicionario_exercicios = lista_exercicios_global;

/* ==========================================================================
   CARREGAMENTO E PERSISTÊNCIA (localStorage)
   ========================================================================== */

function normalizar_exercicio(ex) {
    if (!ex) return ex;
    // Garante que categorias é um array
    if (!Array.isArray(ex.categorias)) {
        ex.categorias = ex.categoria
            ? ex.categoria.split(",").map(s => s.trim()).filter(Boolean)
            : [];
    }
    // Garante que musculos é um array
    if (!Array.isArray(ex.musculos)) {
        ex.musculos = ex.musculo
            ? ex.musculo.split(",").map(s => s.trim()).filter(Boolean)
            : [];
    }
    // Mantém strings para compatibilidade
    if (!ex.categoria && ex.categorias.length > 0) {
        ex.categoria = ex.categorias.join(", ");
    }
    if (!ex.musculo && ex.musculos.length > 0) {
        ex.musculo = ex.musculos.join(", ");
    }
    return ex;
}

function dias_no_mes_pr(mes, ano) {
    if (mes === 2) {
        const ano_bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
        return ano_bissexto ? 29 : 28;
    }
    return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

function atualizar_limite_dia_pr() {
    const mes = Number(document.getElementById("campo_ex_pr_mes").value);
    const ano = Number(document.getElementById("campo_ex_pr_ano").value);
    const dia = document.getElementById("campo_ex_pr_dia");
    if (Number.isInteger(mes) && mes >= 1 && mes <= 12) {
        const dias = mes === 2 && Number.isInteger(ano) && ano > 0
            ? dias_no_mes_pr(mes, ano)
            : (mes === 2 ? 29 : dias_no_mes_pr(mes, 2000));
        dia.max = String(dias);
    } else {
        dia.max = "31";
    }
}

function data_pr_valida(mes, dia, ano) {
    return Number.isInteger(mes) && mes >= 1 && mes <= 12 &&
        Number.isInteger(ano) && ano > 0 &&
        Number.isInteger(dia) && dia >= 1 && dia <= dias_no_mes_pr(mes, ano);
}

function formatar_data_pr(ex) {
    if (!data_pr_valida(Number(ex.pr_month), Number(ex.pr_day), Number(ex.pr_year))) {
        return "No PR date recorded.";
    }
    return `${ex.pr_day}-${ex.pr_month}-${ex.pr_year}`;
}

function formatar_forca_relativa_pr(ex) {
    const pr = Number(ex.pr_valor);
    const bw = Number(ex.bw_at_pr);
    const unidadePr = ex.pr_unidade || "Kg";
    const unidadeBw = ex.bw_at_pr_unidade || "Kg";
    if (ex.pr_valor === undefined || ex.pr_valor === "" || !Number.isFinite(pr) || pr <= 0 ||
        ex.bw_at_pr === undefined || ex.bw_at_pr === "" || !Number.isFinite(bw) || bw <= 0 ||
        !["Kg", "Lb"].includes(unidadePr) || !["Kg", "Lb"].includes(unidadeBw)) {
        return "";
    }

    const prKg = unidadePr === "Lb" ? pr * 0.45359237 : pr;
    const bwKg = unidadeBw === "Lb" ? bw * 0.45359237 : bw;
    return ` -> ${Number((prKg / bwKg).toFixed(2))} BW`;
}

function abrir_busca_tempo() {
    if (exercicios_selecionados_busca_tempo.size === 0) {
        alert("You need to select at least three items.");
        return;
    }

    treinos_resultado_busca_tempo = encontrar_treinos_busca_tempo();
    indice_treino_busca_tempo = 0;
    renderizar_treino_busca_tempo();

    const tela = document.getElementById("tela_busca_tempo");
    tela.style.display = "flex";
    tela.setAttribute("aria-hidden", "false");
    desenhar_ligacoes_busca_tempo(); // a tela já está visível, por isso já há medidas para as ligações
    document.getElementById("fechar_busca_tempo").focus();
}

/* ligações de agrupamento (pontos + linhas), iguais às do modo leitura da tela de edição */
let observador_ligacoes_busca_tempo = null;

function desenhar_ligacoes_busca_tempo() {
    const conteudo = document.getElementById("lista_treino_busca_tempo");
    if (!conteudo || conteudo.clientWidth === 0) return; // tela escondida: não há nada para medir
    desenhar_ligacoes_exercicios(conteudo, true);
}

function preparar_ligacoes_busca_tempo(conteudo) {
    if (typeof ResizeObserver === "function") {
        if (!observador_ligacoes_busca_tempo) {
            observador_ligacoes_busca_tempo = new ResizeObserver(() => {
                requestAnimationFrame(desenhar_ligacoes_busca_tempo);
            });
        }
        // as linhas voltam a ser desenhadas se a janela ou alguma caixa mudar de tamanho
        observador_ligacoes_busca_tempo.disconnect();
        observador_ligacoes_busca_tempo.observe(conteudo);
        conteudo.querySelectorAll(".linha_exercicio").forEach(linha => observador_ligacoes_busca_tempo.observe(linha));
    }
    desenhar_ligacoes_busca_tempo();
}

function encontrar_treinos_busca_tempo() {
    const nomes_selecionados = new Set(
        lista_exercicios_global
            .filter(ex => exercicios_selecionados_busca_tempo.has(String(ex.id)))
            .map(ex => normalizar_texto(ex.nome))
    );
    const por_data = [];

    Object.entries(treinos).forEach(([chave, lista]) => {
        const [ano, mes, dia] = chave.split("-").map(Number);
        const data = new Date(ano, mes - 1, dia);
        if (!Number.isFinite(data.getTime()) || !Array.isArray(lista)) return;

        lista.forEach(treino => {
            const exercicios = Array.isArray(treino.exercicios) ? treino.exercicios : [];
            const encontrados = exercicios.some(ex =>
                !ex.separador && nomes_selecionados.has(normalizar_texto(ex.nome || ""))
            );
            if (encontrados) por_data.push({ chave, data, treino });
        });
    });

    return por_data.sort((a, b) => b.data - a.data);
}

function renderizar_treino_busca_tempo() {
    const conteudo = document.getElementById("lista_treino_busca_tempo");
    const rotulo_data = document.getElementById("data_treino_busca_tempo");
    const mais_recente = document.getElementById("treino_busca_tempo_mais_recente");
    const mais_antigo = document.getElementById("treino_busca_tempo_mais_antigo");
    conteudo.replaceChildren();

    const sem_resultados = treinos_resultado_busca_tempo.length === 0;
    mais_recente.disabled = sem_resultados || indice_treino_busca_tempo === 0;
    mais_antigo.disabled = sem_resultados || indice_treino_busca_tempo === treinos_resultado_busca_tempo.length - 1;

    if (sem_resultados) {
        rotulo_data.textContent = "";
        const mensagem = document.createElement("p");
        mensagem.className = "busca_tempo_vazio";
        mensagem.textContent = "No workout sessions found for the selected exercises.";
        conteudo.appendChild(mensagem);
        return;
    }

    const atual = treinos_resultado_busca_tempo[indice_treino_busca_tempo];
    const [ano, mes, dia] = atual.chave.split("-").map(Number);
    rotulo_data.textContent = `${String(dia).padStart(2, "0")}-${String(mes).padStart(2, "0")}-${ano}`;
    const itens = Array.isArray(atual.treino.exercicios)
        ? atual.treino.exercicios.map(ex => ({ ...ex }))
        : [];
    const tem_nomes_nas_secoes = itens.some(ex => ex.separador && ex.nome);
    if (atual.treino.nome && !tem_nomes_nas_secoes) {
        if (itens[0] && itens[0].separador) {
            itens[0].nome = atual.treino.nome;
        } else {
            itens.unshift({
                separador: true,
                nome: atual.treino.nome,
                horas: "00",
                minutos: "00"
            });
        }
        itens.forEach(ex => {
            if (ex.separador && !ex.nome) ex.nome = atual.treino.nome;
        });
    }

    let numero_exercicio = 0;
    itens.forEach(item => {
        if (item.separador) {
            const separador = document.createElement("div");
            separador.className = "linha_separador";
            separador.innerHTML = `
                <span class="traco_separador"></span>
                <input type="text" class="input_nome_sep" placeholder="Workout name..." readonly>
                <button type="button" class="botao_hora_separador" disabled></button>
                <span class="traco_separador"></span>
            `;
            separador.querySelector(".input_nome_sep").value = item.nome || "";
            separador.querySelector(".botao_hora_separador").textContent =
                `Time: ${item.horas || "00"}:${item.minutos || "00"}`;
            conteudo.appendChild(separador);
            return;
        }

        numero_exercicio++;
        conteudo.appendChild(criar_exercicio_leitura_busca(item, numero_exercicio));
    });
    preparar_ligacoes_busca_tempo(conteudo);
}

function criar_exercicio_leitura_busca(dados, numero) {
    const linha = document.createElement("div");
    linha.className = "linha_exercicio";
    linha.innerHTML = `
        <div class="ex_topo">
            <span class="ex_ponto_ligacao" aria-hidden="true"></span>
            <button type="button" class="ex_numero" disabled></button>
            <span class="ex_alerta" title="The sets table has empty fields">!</span>
            <span class="ex_selecionado"></span>
        </div>
        <div class="ex_coluna_esquerda">
            <div class="ex_rm">
                <label>Stipulated daily RM</label>
                <input type="text" class="ex_rm_valor" readonly>
                <span class="ex_rm_unidade"></span>
            </div>
        </div>
        <div class="ex_area_tabela">
            <div class="ex_tabela_scroll"></div>
            <div class="ex_botoes_colunas">
                <button type="button" class="ex_botao_tabela ex_col_menos"></button>
            </div>
            <div class="ex_botoes_linhas">
                <button type="button" class="ex_botao_tabela ex_lin_menos"></button>
            </div>
        </div>
        <div class="ex_detalhes_execucao">
            <label class="ex_label_detalhes">Execution details:</label>
            <textarea class="ex_textarea" readonly></textarea>
        </div>
    `;

    // agrupamentos guardados no treino (mesma leitura que a tela de edição faz)
    const ligacoes = Array.isArray(dados.grupos_ligacao)
        ? dados.grupos_ligacao
        : dados.grupo_agrupamento ? [String(dados.grupo_agrupamento)] : [];
    linha._linksAgrupamento = [...new Set(ligacoes.map(String))];

    linha.querySelector(".ex_numero").textContent = String(numero);
    // o nome vai a negrito, como na tela de edição
    const campo_nome = linha.querySelector(".ex_selecionado");
    if (dados.nome) {
        const nome = document.createElement("strong");
        nome.textContent = dados.nome;
        campo_nome.appendChild(nome);
    } else {
        campo_nome.textContent = "No exercise selected";
        campo_nome.classList.add("sem_escolha");
    }
    linha.querySelector(".ex_rm_valor").value = dados.rm_diario || "";
    linha.querySelector(".ex_rm_unidade").textContent = dados.rm_unidade || "";
    linha.querySelector(".ex_textarea").value = dados.detalhes || dados.notas || "";
    construir_tabela(linha, dados.tabela || tabela_a_partir_de_antigo(dados));
    linha.querySelectorAll("input, select, textarea, button").forEach(campo => {
        campo.disabled = true;
        campo.readOnly = true;
    });
    return linha;
}

function mudar_treino_busca_tempo(direcao) {
    const novo_indice = indice_treino_busca_tempo - direcao;
    if (novo_indice < 0 || novo_indice >= treinos_resultado_busca_tempo.length) return;
    indice_treino_busca_tempo = novo_indice;
    renderizar_treino_busca_tempo();
}

function fechar_busca_tempo() {
    const tela = document.getElementById("tela_busca_tempo");
    tela.style.display = "none";
    tela.setAttribute("aria-hidden", "true");
    exercicios_selecionados_busca_tempo.clear();
    document.querySelectorAll(".selecao_busca_tempo").forEach(selecao => {
        selecao.checked = false;
    });
    treinos_resultado_busca_tempo = [];
    indice_treino_busca_tempo = 0;
    if (observador_ligacoes_busca_tempo) observador_ligacoes_busca_tempo.disconnect();
    atualizar_contador_busca_tempo();
    document.getElementById("btn_busca_tempo").focus();
}

document.getElementById("tela_busca_tempo").addEventListener("click", event => {
    if (event.target === event.currentTarget) fechar_busca_tempo();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.getElementById("tela_busca_tempo").style.display === "flex") {
        fechar_busca_tempo();
    }
});

function carregar_exercicios_storage() {
    try {
        const dados = localStorage.getItem(CHAVE_STORAGE_EXERCICIOS);
        if (dados) {
            const parsed = JSON.parse(dados);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(normalizar_exercicio);
            }
        }
    } catch (e) {
        console.error("Erro ao carregar dados do dicionário de exercícios:", e);
    }

    // Inicializa com exercícios padrão se ainda não existir nada guardado
    const padroes = EXERCICIOS_PADRAO.map(normalizar_exercicio);
    localStorage.setItem(CHAVE_STORAGE_EXERCICIOS, JSON.stringify(padroes));
    return padroes;
}

function salvar_exercicios_storage() {
    try {
        localStorage.setItem(CHAVE_STORAGE_EXERCICIOS, JSON.stringify(lista_exercicios_global));
        window.dicionario_exercicios = lista_exercicios_global;
        atualizar_datalist_exercicios();
    } catch (e) {
        console.error("Erro ao guardar dicionário no localStorage:", e);
        alert("Erro ao guardar dados no navegador.");
    }
}

// Helpers para acesso global por outros ficheiros/módulos
window.obter_exercicios_dicionario = function() {
    return lista_exercicios_global;
};

window.pesquisar_exercicio_dicionario = function(termo, campo = "todos") {
    if (!termo || termo.trim() === "") return lista_exercicios_global;
    const t = termo.toLowerCase().trim();
    return lista_exercicios_global.filter(ex => {
        const nome = (ex.nome || "").toLowerCase();
        const cats = (ex.categorias || [ex.categoria || ""]).map(c => c.toLowerCase());
        const muscs = (ex.musculos || [ex.musculo || ""]).map(m => m.toLowerCase());
        const desc = (ex.descricao || "").toLowerCase();

        if (campo === "nome") return nome.includes(t);
        if (campo === "categoria") return cats.some(c => c.includes(t));
        if (campo === "musculo") return muscs.some(m => m.includes(t));

        return (
            nome.includes(t) ||
            cats.some(c => c.includes(t)) ||
            muscs.some(m => m.includes(t)) ||
            desc.includes(t)
        );
    });
};

/* ==========================================================================
   INICIALIZAÇÃO DO MENU DE EXERCÍCIOS
   ========================================================================== */

function inicializar_menu_exercicios() {
    lista_exercicios_global = carregar_exercicios_storage();
    window.dicionario_exercicios = lista_exercicios_global;

    carregar_opcoes_personalizadas();
    popular_selects_navbar_e_pr();
    gerar_checkboxes_formulario();
    atualizar_datalist_exercicios();
    filtrar_exercicios_dicionario();
}

function popular_selects_navbar_e_pr() {
    preencher_select("campo_ex_pr_unidade", UNIDADES_PR);
    renderizar_chips_filtros_dicionario();
}

/* ==========================================================================
   FILTROS MULTI-SELEÇÃO DE CATEGORIAS E MÚSCULOS
   ========================================================================== */

function obter_conjuntos_filtro(contexto = contexto_modal_filtros_exercicio) {
    if (contexto && contexto.tipo === "treino") {
        return {
            categorias: contexto.linha._filtrosCategoria,
            musculos: contexto.linha._filtrosMusculo
        };
    }
    return {
        categorias: filtros_dicionario_categorias,
        musculos: filtros_dicionario_musculos
    };
}

function renderizar_chips_filtros_dicionario() {
    [
        ["chips_filtro_categorias", filtros_dicionario_categorias, "Category"],
        ["chips_filtro_musculos", filtros_dicionario_musculos, "Muscle"]
    ].forEach(([id, valores, tipo]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.replaceChildren();
        valores.forEach(valor => {
            const chip = document.createElement("span");
            chip.className = "filtro_multi_chip";
            chip.append(document.createTextNode(valor));
            const remover = document.createElement("button");
            remover.type = "button";
            remover.className = "filtro_chip_remover";
            remover.textContent = "×";
            remover.title = `Remove ${valor} from the filter`;
            remover.setAttribute("aria-label", `Remove ${valor} from the filter`);
            remover.addEventListener("click", () => {
                valores.delete(valor);
                renderizar_chips_filtros_dicionario();
                filtrar_exercicios_dicionario();
            });
            chip.appendChild(remover);
            el.appendChild(chip);
        });
    });
    const botao = document.querySelector("#filtro_categoria_exercicio .dd_botao");
    if (botao) {
        const resumo = [
            filtros_dicionario_categorias.size && `Categories: ${[...filtros_dicionario_categorias].join(", ")}`,
            filtros_dicionario_musculos.size && `Muscles: ${[...filtros_dicionario_musculos].join(", ")}`
        ].filter(Boolean);
        botao.title = resumo.join(" | ") || "Search with Categories and Muscles";
    }
}

function abrir_modal_filtros_exercicio(linha = null) {
    contexto_modal_filtros_exercicio = linha
        ? { tipo: "treino", linha }
        : { tipo: "dicionario" };
    const titulo = document.getElementById("titulo_filtros_exercicio");
    titulo.textContent = linha ? "Filter exercise suggestions" : "Filter exercises";
    document.getElementById("tela_filtros_exercicio").style.display = "flex";
    document.getElementById("tela_filtros_exercicio").setAttribute("aria-hidden", "false");
    renderizar_opcoes_modal_filtros_exercicio();
    document.querySelector(".filtros_exercicio_topo button").focus();
}

function fechar_modal_filtros_exercicio() {
    const modal = document.getElementById("tela_filtros_exercicio");
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
    contexto_modal_filtros_exercicio = null;
}

function renderizar_opcoes_modal_filtros_exercicio() {
    const conjuntos = obter_conjuntos_filtro();
    [
        ["opcoes_filtro_categorias", "categoria", CATEGORIAS_EXERCICIOS, conjuntos.categorias],
        ["opcoes_filtro_musculos", "musculo", MUSCULOS_EXERCICIOS, conjuntos.musculos]
    ].forEach(([id, tipo, opcoes, selecionados]) => {
        const container = document.getElementById(id);
        container.replaceChildren();
        opcoes.forEach(valor => {
            const linha = document.createElement("div");
            linha.className = "filtro_multi_opcao";
            const label = document.createElement("label");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = selecionados.has(valor);
            checkbox.addEventListener("change", () => {
                if (checkbox.checked) selecionados.add(valor);
                else selecionados.delete(valor);
                if (contexto_modal_filtros_exercicio.tipo === "dicionario") {
                    renderizar_chips_filtros_dicionario();
                    filtrar_exercicios_dicionario();
                } else {
                    atualizar_rotulo_filtros_treino(contexto_modal_filtros_exercicio.linha);
                    atualizar_sugestoes(contexto_modal_filtros_exercicio.linha);
                }
            });
            const texto = document.createElement("span");
            texto.textContent = valor;
            label.append(checkbox, texto);
            linha.appendChild(label);

            if (contexto_modal_filtros_exercicio.tipo === "dicionario") {
                const remover = document.createElement("button");
                remover.type = "button";
                remover.className = "dd_item_x";
                remover.textContent = "×";
                remover.title = `Remove "${valor}"`;
                remover.setAttribute("aria-label", `Remove ${valor}`);
                remover.addEventListener("click", () => {
                    fechar_modal_filtros_exercicio();
                    pedir_remocao_opcao(tipo, valor);
                });
                linha.appendChild(remover);
            }
            container.appendChild(linha);
        });
    });
}

function limpar_filtros_modal_exercicio() {
    if (!contexto_modal_filtros_exercicio) return;
    const conjuntos = obter_conjuntos_filtro();
    conjuntos.categorias.clear();
    conjuntos.musculos.clear();
    if (contexto_modal_filtros_exercicio.tipo === "dicionario") {
        renderizar_chips_filtros_dicionario();
        filtrar_exercicios_dicionario();
    } else {
        atualizar_rotulo_filtros_treino(contexto_modal_filtros_exercicio.linha);
        atualizar_sugestoes(contexto_modal_filtros_exercicio.linha);
    }
    renderizar_opcoes_modal_filtros_exercicio();
}

document.getElementById("tela_filtros_exercicio").addEventListener("click", event => {
    if (event.target === event.currentTarget) fechar_modal_filtros_exercicio();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        fechar_modal_filtros_exercicio();
        fechar_modal_remocao_opcao();
    }
});

function preencher_select(selectId, opcoes, opcaoPadrao = null) {
    const el = document.getElementById(selectId);
    if (!el) return;

    el.innerHTML = "";
    if (opcaoPadrao !== null) {
        const optDefault = document.createElement("option");
        optDefault.value = "";
        optDefault.textContent = opcaoPadrao;
        el.appendChild(optDefault);
    }

    opcoes.forEach(op => {
        const opt = document.createElement("option");
        opt.value = op;
        opt.textContent = op;
        el.appendChild(opt);
    });
}

/* ==========================================================================
   GERAÇÃO E CONTROLO DE CHECKBOXES (Categorias e Músculos - Máx 4)
   ========================================================================== */

function gerar_checkboxes_formulario() {
    // 1. Checkboxes para Categorias
    const containerCat = document.getElementById("container_checkboxes_categoria");
    if (containerCat) {
        containerCat.innerHTML = "";
        CATEGORIAS_EXERCICIOS.forEach(cat => {
            const label = document.createElement("label");
            label.classList.add("item_checkbox");

            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = "cat_checkbox";
            input.value = cat;

            input.addEventListener("change", function() {
                monitorar_limite_checkbox("categoria", this);
            });

            const span = document.createElement("span");
            span.textContent = cat;

            label.appendChild(input);
            label.appendChild(span);
            containerCat.appendChild(label);
        });
        atualizar_contador_selecao("categoria");
    }

    // 2. Checkboxes para Músculos
    const containerMusc = document.getElementById("container_checkboxes_musculo");
    if (containerMusc) {
        containerMusc.innerHTML = "";
        MUSCULOS_EXERCICIOS.forEach(musc => {
            const label = document.createElement("label");
            label.classList.add("item_checkbox");

            const input = document.createElement("input");
            input.type = "checkbox";
            input.name = "musc_checkbox";
            input.value = musc;

            input.addEventListener("change", function() {
                monitorar_limite_checkbox("musculo", this);
            });

            const span = document.createElement("span");
            span.textContent = musc;

            label.appendChild(input);
            label.appendChild(span);
            containerMusc.appendChild(label);
        });
        atualizar_contador_selecao("musculo");
    }
}

function monitorar_limite_checkbox(tipo, inputElement) {
    const nomeInput = tipo === "categoria" ? "cat_checkbox" : "musc_checkbox";
    const maximo = tipo === "categoria" ? MAX_SELECAO_CATEGORIAS : MAX_SELECAO_MUSCULOS;
    const marcados = document.querySelectorAll(`input[name="${nomeInput}"]:checked`);

    if (marcados.length > maximo) {
        inputElement.checked = false;
        if (inputElement.parentElement) {
            inputElement.parentElement.classList.remove("marcado");
        }
        alert(`Atenção: Podes escolher no máximo ${maximo} ${tipo === "categoria" ? "categorias" : "músculos"}!`);
        return;
    }

    // Atualiza classe visual no label
    if (inputElement.parentElement) {
        inputElement.parentElement.classList.toggle("marcado", inputElement.checked);
    }

    atualizar_contador_selecao(tipo);

    // Limpa erro visual se foi preenchido pelo menos 1
    if (marcados.length > 0) {
        const idContainer = tipo === "categoria" ? "container_checkboxes_categoria" : "container_checkboxes_musculo";
        limpar_erro_campo(idContainer);
    }
}

function atualizar_contador_selecao(tipo) {
    const nomeInput = tipo === "categoria" ? "cat_checkbox" : "musc_checkbox";
    const maximo = tipo === "categoria" ? MAX_SELECAO_CATEGORIAS : MAX_SELECAO_MUSCULOS;
    const idContador = tipo === "categoria" ? "contador_cat_selecionadas" : "contador_musc_selecionados";
    const contadorEl = document.getElementById(idContador);
    if (!contadorEl) return;

    const total = document.querySelectorAll(`input[name="${nomeInput}"]:checked`).length;
    contadorEl.textContent = `${total} / ${maximo} selected`;

    if (total === maximo) {
        contadorEl.classList.add("limite_atingido");
        contadorEl.textContent = `${total} / ${maximo} (Max)`;
    } else {
        contadorEl.classList.remove("limite_atingido");
    }
}

function obter_categorias_selecionadas() {
    const marcados = document.querySelectorAll('input[name="cat_checkbox"]:checked');
    return Array.from(marcados).map(cb => cb.value);
}

function obter_musculos_selecionados() {
    const marcados = document.querySelectorAll('input[name="musc_checkbox"]:checked');
    return Array.from(marcados).map(cb => cb.value);
}

function definir_categorias_selecionadas(categorias) {
    const lista = Array.isArray(categorias) ? categorias : (categorias ? [categorias] : []);
    document.querySelectorAll('input[name="cat_checkbox"]').forEach(cb => {
        cb.checked = lista.includes(cb.value);
        if (cb.parentElement) {
            cb.parentElement.classList.toggle("marcado", cb.checked);
        }
    });
    atualizar_contador_selecao("categoria");
}

function definir_musculos_selecionados(musculos) {
    const lista = Array.isArray(musculos) ? musculos : (musculos ? [musculos] : []);
    document.querySelectorAll('input[name="musc_checkbox"]').forEach(cb => {
        cb.checked = lista.includes(cb.value);
        if (cb.parentElement) {
            cb.parentElement.classList.toggle("marcado", cb.checked);
        }
    });
    atualizar_contador_selecao("musculo");
}

function limpar_checkboxes_selecionados() {
    document.querySelectorAll('input[name="cat_checkbox"], input[name="musc_checkbox"]').forEach(cb => {
        cb.checked = false;
        if (cb.parentElement) {
            cb.parentElement.classList.remove("marcado");
        }
    });
    atualizar_contador_selecao("categoria");
    atualizar_contador_selecao("musculo");
}

function atualizar_datalist_exercicios() {
    let datalist = document.getElementById("lista_sugestoes_exercicios");
    if (!datalist) {
        datalist = document.createElement("datalist");
        datalist.id = "lista_sugestoes_exercicios";
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = "";

    lista_exercicios_global.forEach(ex => {
        const option = document.createElement("option");
        option.value = ex.nome;
        const muscTxt = (ex.musculos || [ex.musculo || ""]).join(", ");
        const catTxt = (ex.categorias || [ex.categoria || ""]).join(", ");
        option.label = `${muscTxt} | ${catTxt}${ex.pr_valor ? ' | PR: ' + ex.pr_valor + ' ' + ex.pr_unidade : ''}`;
        datalist.appendChild(option);
    });
}

/* ==========================================================================
   REMOVER CATEGORIA / MÚSCULO (com aviso dos exercícios afetados)
   ========================================================================== */

let remocao_opcao_pendente = null;   // { tipo, nome }

function exercicios_com_opcao(tipo, nome) {
    return lista_exercicios_global.filter(ex => {
        normalizar_exercicio(ex);
        const valores = tipo === "categoria" ? ex.categorias : ex.musculos;
        return Array.isArray(valores) && valores.includes(nome);
    });
}

function pedir_remocao_opcao(tipo, nome) {
    const afetados = exercicios_com_opcao(tipo, nome);
    const nomeTipo = tipo === "categoria" ? "category" : "muscle";
    remocao_opcao_pendente = { tipo, nome };

    document.getElementById("modal_remocao_texto").textContent = afetados.length > 0
        ? `Upon performing this removal ("${nome}"), the following exercises will be affected:`
        : `Upon performing this removal ("${nome}"), no exercise will be affected.`;

    const lista = document.getElementById("modal_remocao_lista");
    lista.innerHTML = "";
    if (afetados.length > 0) {
        afetados.forEach(ex => {
            const linha = document.createElement("div");
            linha.textContent = ex.nome;
            lista.appendChild(linha);
        });
        lista.style.display = "block";
    } else {
        lista.style.display = "none";
    }

    // exercícios que ficariam sem nenhuma categoria / músculo
    const ficamVazios = afetados.filter(ex => (tipo === "categoria" ? ex.categorias : ex.musculos).length === 1);
    const aviso = document.getElementById("modal_remocao_aviso_vazio");
    if (ficamVazios.length > 0) {
        aviso.textContent = `${ficamVazios.length} exercise(s) will be left without any ${nomeTipo}. Choose a new one when editing them.`;
        aviso.style.display = "block";
    } else {
        aviso.style.display = "none";
    }

    document.getElementById("modal_remocao_opcao").style.display = "flex";
    document.getElementById("modal_remocao_cancelar").focus();
}

function fechar_modal_remocao_opcao() {
    const modal = document.getElementById("modal_remocao_opcao");
    if (modal) modal.style.display = "none";
    remocao_opcao_pendente = null;
}

function confirmar_remocao_opcao() {
    if (!remocao_opcao_pendente) return;
    const { tipo, nome } = remocao_opcao_pendente;
    const ehCategoria = tipo === "categoria";

    // 1. tira a opção dos exercícios que a usam
    exercicios_com_opcao(tipo, nome).forEach(ex => {
        if (ehCategoria) {
            ex.categorias = ex.categorias.filter(c => c !== nome);
            ex.categoria = ex.categorias.join(", ");
        } else {
            ex.musculos = ex.musculos.filter(m => m !== nome);
            ex.musculo = ex.musculos.join(", ");
        }
    });

    // 2. tira a opção das listas guardadas (criadas pelo utilizador ou padrão)
    try {
        const chaveExtra = ehCategoria ? CHAVE_STORAGE_CATEGORIAS : CHAVE_STORAGE_MUSCULOS;
        const chaveRemovidas = ehCategoria ? CHAVE_STORAGE_CATEGORIAS_REMOVIDAS : CHAVE_STORAGE_MUSCULOS_REMOVIDOS;
        const padrao = ehCategoria ? CATEGORIAS_PADRAO : MUSCULOS_PADRAO;

        const extras = ler_lista_storage(chaveExtra).filter(x => normalizar_opcao(x) !== normalizar_opcao(nome));
        localStorage.setItem(chaveExtra, JSON.stringify(extras));

        if (padrao.some(x => normalizar_opcao(x) === normalizar_opcao(nome))) {
            const removidas = ler_lista_storage(chaveRemovidas);
            if (!removidas.some(x => normalizar_opcao(x) === normalizar_opcao(nome))) {
                removidas.push(nome);
                localStorage.setItem(chaveRemovidas, JSON.stringify(removidas));
            }
        }
    } catch (e) {
        console.error("Erro ao guardar a remoção no localStorage:", e);
        alert("Erro ao guardar dados no navegador.");
    }

    salvar_exercicios_storage();
    carregar_opcoes_personalizadas();
    atualizar_listas_opcoes_ui();      // refaz dropdowns e checkboxes (mantém o resto das escolhas)
    filtrar_exercicios_dicionario();
    fechar_modal_remocao_opcao();
}

(function ligar_modal_remocao_opcao() {
    function ligar() {
        const cancelar = document.getElementById("modal_remocao_cancelar");
        const confirmar = document.getElementById("modal_remocao_confirmar");
        const fundo = document.getElementById("modal_remocao_opcao");
        if (cancelar) cancelar.addEventListener("click", fechar_modal_remocao_opcao);
        if (confirmar) confirmar.addEventListener("click", confirmar_remocao_opcao);
        if (fundo) fundo.addEventListener("click", function(e) {
            if (e.target === fundo) fechar_modal_remocao_opcao();   // clicar fora = cancelar
        });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar);
    else ligar();
})();

/* ==========================================================================
   FEEDBACK DE ERRO E VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
   ========================================================================== */

function marcar_erro_campo(idElemento) {
    const el = document.getElementById(idElemento);
    if (el) {
        el.classList.add("campo_obrigatorio_erro");
    }
}

function limpar_erro_campo(idElemento) {
    const el = document.getElementById(idElemento);
    if (el) {
        el.classList.remove("campo_obrigatorio_erro");
    }
    // Esconde a mensagem se todos os campos já estiverem sem erro
    const aindaComErro = document.querySelectorAll(".campo_obrigatorio_erro");
    if (aindaComErro.length === 0) {
        esconder_mensagem_erro();
    }
}

function limpar_todos_erros() {
    document.querySelectorAll(".campo_obrigatorio_erro").forEach(el => {
        el.classList.remove("campo_obrigatorio_erro");
    });
    esconder_mensagem_erro();
}

function exibir_mensagem_erro(msg) {
    const box = document.getElementById("msg_erro_formulario");
    if (box) {
        box.textContent = msg;
        box.style.display = "block";
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

function esconder_mensagem_erro() {
    const box = document.getElementById("msg_erro_formulario");
    if (box) {
        box.style.display = "none";
        box.textContent = "";
    }
}

/* ==========================================================================
   CONTROLO DE VISIBILIDADE DE TELAS
   ========================================================================== */

function abrir_dicionario_exercicios() {
    // 1. Fechar o calendário se a função existir
    if (typeof fechar_calendario === "function") {
        fechar_calendario();
    } else {
        const cal = document.getElementById("calendario");
        if (cal) cal.style.display = "none";
        const bAnt = document.getElementById("botao_mes_anterior");
        if (bAnt) bAnt.style.display = "none";
        const bSeg = document.getElementById("botao_mes_seguinte");
        if (bSeg) bSeg.style.display = "none";
        const tit = document.getElementById("titulo_calendario");
        if (tit) tit.style.display = "none";
    }

    // 2. Fechar outras telas e modais
    const outrasTelas = [
        "tela_editar_treino",
        "tela_notas_dia",
        "tela_horas"
    ];
    outrasTelas.forEach(id => {
        const t = document.getElementById(id);
        if (t) t.style.display = "none";
    });

    // 3. Exibir a tela do dicionário
    const tela = document.getElementById("tela_dicionario_exercicios");
    if (tela) {
        tela.style.display = "flex";
    }

    // 4. Garantir que os dados e filtros estão atualizados
    popular_selects_navbar_e_pr();
    const contCat = document.getElementById("container_checkboxes_categoria");
    if (!contCat || contCat.children.length === 0) {
        gerar_checkboxes_formulario();
    }
    filtrar_exercicios_dicionario();
}

function fechar_dicionario_exercicios(voltarAoCalendario = false) {
    const tela = document.getElementById("tela_dicionario_exercicios");
    if (tela) {
        tela.style.display = "none";
    }

    cancelar_edicao_exercicio();
    alternar_painel_add_opcao(null, false);

    if (voltarAoCalendario && typeof abrir_calendario === "function") {
        abrir_calendario();
    }
}

/* ==========================================================================
   PAINÉIS DE AÇÃO (Adicionar Exercício / Categoria / Músculo)
   ========================================================================== */

function alternar_form_exercicio(forcar = null) {
    const painel = document.getElementById("painel_form_exercicio");
    if (!painel) return;

    const abrir = forcar !== null ? forcar : (painel.style.display === "none" || painel.style.display === "");
    painel.style.display = abrir ? "block" : "none";

    const btn = document.getElementById("btn_toggle_form_exercicio");
    if (btn) {
        btn.textContent = abrir ? "▲ Hide Form" : "➕ Add Exercise";
    }

    if (abrir) {
        const inputNome = document.getElementById("campo_ex_nome");
        if (inputNome) inputNome.focus();
    } else {
        limpar_todos_erros();
    }
}

/* ---------- Adicionar categoria / músculo ---------- */

let tipo_opcao_em_adicao = "categoria";   // "categoria" | "musculo"

function ler_lista_storage(chave) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave) || "[]");
        return Array.isArray(dados) ? dados.filter(x => typeof x === "string" && x.trim()) : [];
    } catch (e) {
        return [];
    }
}

function normalizar_opcao(texto) {
    // sem maiúsculas, espaços a mais nem acentos: "Shoulders - Lateral" == "shoulders  - lateral"
    return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function juntar_opcoes(padrao, extra) {
    const lista = padrao.slice();
    extra.forEach(item => {
        if (!lista.some(x => normalizar_opcao(x) === normalizar_opcao(item))) lista.push(item);
    });
    return lista;
}

function sem_removidas(padrao, removidas) {
    return padrao.filter(x => !removidas.some(r => normalizar_opcao(r) === normalizar_opcao(x)));
}

function carregar_opcoes_personalizadas() {
    CATEGORIAS_EXERCICIOS = juntar_opcoes(
        sem_removidas(CATEGORIAS_PADRAO, ler_lista_storage(CHAVE_STORAGE_CATEGORIAS_REMOVIDAS)),
        ler_lista_storage(CHAVE_STORAGE_CATEGORIAS)
    );
    MUSCULOS_EXERCICIOS = juntar_opcoes(
        sem_removidas(MUSCULOS_PADRAO, ler_lista_storage(CHAVE_STORAGE_MUSCULOS_REMOVIDOS)),
        ler_lista_storage(CHAVE_STORAGE_MUSCULOS)
    );
}

// Atualiza os selects do topo e as checkboxes do formulário, sem perder o que já estava escolhido
function atualizar_listas_opcoes_ui() {
    const catsMarcadas = obter_categorias_selecionadas();
    const muscsMarcados = obter_musculos_selecionados();

    popular_selects_navbar_e_pr();
    filtros_dicionario_categorias.forEach(valor => {
        if (!CATEGORIAS_EXERCICIOS.includes(valor)) filtros_dicionario_categorias.delete(valor);
    });
    filtros_dicionario_musculos.forEach(valor => {
        if (!MUSCULOS_EXERCICIOS.includes(valor)) filtros_dicionario_musculos.delete(valor);
    });

    gerar_checkboxes_formulario();
    definir_categorias_selecionadas(catsMarcadas);
    definir_musculos_selecionados(muscsMarcados);
    renderizar_chips_filtros_dicionario();
    if (contexto_modal_filtros_exercicio) renderizar_opcoes_modal_filtros_exercicio();
}

function mostrar_msg_add_opcao(texto, tipo) {
    const box = document.getElementById("msg_add_opcao");
    if (!box) return;
    box.textContent = texto || "";
    box.className = "msg_add_opcao" + (texto ? ` ${tipo}` : "");
}

function alternar_painel_add_opcao(tipo, forcar = null) {
    const painel = document.getElementById("painel_add_opcao");
    if (!painel) return;

    const aberto = painel.style.display === "block";
    const mesmoTipo = tipo === null || tipo === tipo_opcao_em_adicao;
    // clicar no mesmo botão fecha o painel; clicar no outro troca de categoria para músculo (e vice-versa)
    const abrir = forcar !== null ? forcar : (!aberto || !mesmoTipo);

    if (!abrir) {
        painel.style.display = "none";
        mostrar_msg_add_opcao("", "");
        return;
    }

    if (tipo !== null) tipo_opcao_em_adicao = tipo;
    const ehCategoria = tipo_opcao_em_adicao === "categoria";

    painel.classList.toggle("tipo_musculo", !ehCategoria);
    document.getElementById("titulo_painel_add_opcao").textContent = ehCategoria ? "Add Category" : "Add Muscle";
    document.getElementById("label_nova_opcao").textContent = ehCategoria ? "New category:" : "New muscle:";

    const input = document.getElementById("campo_nova_opcao");
    input.placeholder = ehCategoria ? "e.g. Plyometrics" : "e.g. Shoulders - Lateral";
    input.value = "";
    mostrar_msg_add_opcao("", "");

    painel.style.display = "block";
    input.focus();
}

function guardar_nova_opcao() {
    const ehCategoria = tipo_opcao_em_adicao === "categoria";
    const input = document.getElementById("campo_nova_opcao");
    const valor = (input ? input.value : "").replace(/\s+/g, " ").trim();
    const nomeTipo = ehCategoria ? "category" : "muscle";
    const lista = ehCategoria ? CATEGORIAS_EXERCICIOS : MUSCULOS_EXERCICIOS;

    if (!valor) {
        mostrar_msg_add_opcao(`⚠️ Write the name of the new ${nomeTipo}.`, "erro");
        if (input) input.focus();
        return;
    }
    if (valor.length > MAX_CARACTERES_OPCAO) {
        mostrar_msg_add_opcao(`⚠️ The name can have at most ${MAX_CARACTERES_OPCAO} characters.`, "erro");
        return;
    }
    if (valor.includes(",")) {
        // as categorias/músculos de cada exercício são guardados também como texto separado por vírgulas
        mostrar_msg_add_opcao("⚠️ The name cannot contain commas. Use a dash instead (e.g. Shoulders - Lateral).", "erro");
        return;
    }
    if (lista.some(x => normalizar_opcao(x) === normalizar_opcao(valor))) {
        mostrar_msg_add_opcao(`⚠️ That ${nomeTipo} already exists.`, "erro");
        return;
    }

    const chave = ehCategoria ? CHAVE_STORAGE_CATEGORIAS : CHAVE_STORAGE_MUSCULOS;
    const chaveRemovidas = ehCategoria ? CHAVE_STORAGE_CATEGORIAS_REMOVIDAS : CHAVE_STORAGE_MUSCULOS_REMOVIDOS;
    try {
        const removidas = ler_lista_storage(chaveRemovidas);
        const eraPadraoRemovido = removidas.some(r => normalizar_opcao(r) === normalizar_opcao(valor));
        if (eraPadraoRemovido) {
            // opção original que tinha sido apagada: volta ao sítio de origem
            localStorage.setItem(chaveRemovidas, JSON.stringify(removidas.filter(r => normalizar_opcao(r) !== normalizar_opcao(valor))));
        } else {
            const extras = ler_lista_storage(chave);
            extras.push(valor);
            localStorage.setItem(chave, JSON.stringify(extras));
        }
    } catch (e) {
        console.error("Erro ao guardar a nova opção no localStorage:", e);
        alert("Erro ao guardar dados no navegador.");
        return;
    }

    carregar_opcoes_personalizadas();
    atualizar_listas_opcoes_ui();

    mostrar_msg_add_opcao(`✔ "${valor}" added. It is now available in the filters and in the exercise form.`, "ok");
    input.value = "";
    input.focus();
}

/* ==========================================================================
   ADICIONAR / EDITAR EXERCÍCIO COM VALIDAÇÃO ESTRITA
   ========================================================================== */

function guardar_exercicio_dicionario() {
    limpar_todos_erros();

    const inputNome = document.getElementById("campo_ex_nome");
    const inputPrValor = document.getElementById("campo_ex_pr_valor");
    const inputPrUnidade = document.getElementById("campo_ex_pr_unidade");
    const inputBwValor = document.getElementById("campo_ex_bw_pr_valor");
    const inputBwUnidade = document.getElementById("campo_ex_bw_pr_unidade");
    const inputPrMes = document.getElementById("campo_ex_pr_mes");
    const inputPrDia = document.getElementById("campo_ex_pr_dia");
    const inputPrAno = document.getElementById("campo_ex_pr_ano");
    const inputDescricao = document.getElementById("campo_ex_descricao");
    const inputLink = document.getElementById("campo_ex_link");

    const nome = (inputNome ? inputNome.value : "").trim();
    const pr_valor = (inputPrValor ? inputPrValor.value : "").trim();
    const pr_unidade = inputPrUnidade ? inputPrUnidade.value : UNIDADES_PR[0];
    const bw_at_pr = (inputBwValor ? inputBwValor.value : "").trim();
    const bw_at_pr_unidade = inputBwUnidade ? inputBwUnidade.value : "Kg";
    const pr_month = inputPrMes && inputPrMes.value.trim() ? Number(inputPrMes.value) : null;
    const pr_day = inputPrDia && inputPrDia.value.trim() ? Number(inputPrDia.value) : null;
    const pr_year = inputPrAno && inputPrAno.value.trim() ? Number(inputPrAno.value) : null;
    const categorias = obter_categorias_selecionadas();
    const musculos = obter_musculos_selecionados();
    const descricao = (inputDescricao ? inputDescricao.value : "").trim();
    const link = (inputLink ? inputLink.value : "").trim();

    // 1. Validação dos campos obrigatórios
    const erros = [];

    if (!nome) {
        marcar_erro_campo("campo_ex_nome");
        erros.push("Exercise Name");
    } else if (nome.length > MAX_CARACTERES_NOME_EXERCICIO) {
        marcar_erro_campo("campo_ex_nome");
        erros.push(`Exercise Name (máximo ${MAX_CARACTERES_NOME_EXERCICIO} caracteres)`);
    }

    if (link.length > MAX_CARACTERES_LINK_EXERCICIO) {
        marcar_erro_campo("campo_ex_link");
        erros.push(`Video / Reference Link (máximo ${MAX_CARACTERES_LINK_EXERCICIO} caracteres)`);
    }

    if (pr_valor && (!Number.isFinite(Number(pr_valor)) || Number(pr_valor) < 0)) {
        marcar_erro_campo("campo_ex_pr_valor");
        erros.push("Personal Record (PR) (must be a non-negative number)");
    }

    if (bw_at_pr && (!Number.isFinite(Number(bw_at_pr)) || Number(bw_at_pr) < 0)) {
        marcar_erro_campo("campo_ex_bw_pr_valor");
        erros.push("BW when you hit PR (must be a non-negative number)");
    }

    const data_pr_preenchida = [inputPrMes, inputPrDia, inputPrAno]
        .some(campo => campo && campo.value.trim() !== "");
    if (data_pr_preenchida && !data_pr_valida(pr_month, pr_day, pr_year)) {
        if (!Number.isInteger(pr_month) || pr_month < 1 || pr_month > 12) {
            marcar_erro_campo("campo_ex_pr_mes");
        }
        if (!Number.isInteger(pr_day) || pr_day < 1 ||
            (Number.isInteger(pr_month) && pr_month >= 1 && pr_month <= 12 && pr_day > dias_no_mes_pr(pr_month, pr_year))) {
            marcar_erro_campo("campo_ex_pr_dia");
        }
        if (!Number.isInteger(pr_year) || pr_year < 1) {
            marcar_erro_campo("campo_ex_pr_ano");
        }
        erros.push("PR date (valid month, day and year)");
    }

    if (categorias.length === 0) {
        marcar_erro_campo("container_checkboxes_categoria");
        erros.push("Category (pelo menos 1)");
    } else if (categorias.length > MAX_SELECAO_CATEGORIAS) {
        marcar_erro_campo("container_checkboxes_categoria");
        erros.push(`Category (máximo ${MAX_SELECAO_CATEGORIAS})`);
    }

    if (musculos.length === 0) {
        marcar_erro_campo("container_checkboxes_musculo");
        erros.push("Target Muscle(s) (pelo menos 1)");
    } else if (musculos.length > MAX_SELECAO_MUSCULOS) {
        marcar_erro_campo("container_checkboxes_musculo");
        erros.push(`Target Muscle(s) (máximo ${MAX_SELECAO_MUSCULOS})`);
    }

    if (erros.length > 0) {
        exibir_mensagem_erro(`⚠️ Por favor, preenche todos os campos obrigatórios (*): ${erros.join(", ")}.`);
        return;
    }

    if (descricao.length > 300) {
        alert("A descrição tem um limite máximo de 300 caracteres!");
        if (inputDescricao) inputDescricao.focus();
        return;
    }

    if (id_exercicio_em_edicao !== null) {
        // Modo Edição
        const index = lista_exercicios_global.findIndex(e => e.id === id_exercicio_em_edicao);
        if (index !== -1) {
            lista_exercicios_global[index] = {
                ...lista_exercicios_global[index],
                nome,
                categorias,
                categoria: categorias.join(", "),
                musculos,
                musculo: musculos.join(", "),
                pr_valor,
                pr_unidade,
                bw_at_pr,
                bw_at_pr_unidade,
                pr_month,
                pr_day,
                pr_year,
                descricao,
                link,
                atualizadoEm: new Date().toISOString()
            };
        }
        id_exercicio_em_edicao = null;
    } else {
        // Novo Exercício
        const novoId = lista_exercicios_global.length > 0
            ? Math.max(...lista_exercicios_global.map(e => e.id || 0)) + 1
            : 1;

        const novoExercicio = {
            id: novoId,
            nome,
            categorias,
            categoria: categorias.join(", "),
            musculos,
            musculo: musculos.join(", "),
            pr_valor,
            pr_unidade,
            bw_at_pr,
            bw_at_pr_unidade,
            pr_month,
            pr_day,
            pr_year,
            descricao,
            link,
            criadoEm: new Date().toISOString()
        };

        lista_exercicios_global.unshift(novoExercicio);
    }

    salvar_exercicios_storage();
    limpar_formulario_exercicio();
    alternar_form_exercicio(false);
    filtrar_exercicios_dicionario();
}

function iniciar_edicao_exercicio(id) {
    const ex = lista_exercicios_global.find(e => e.id === id);
    if (!ex) return;

    normalizar_exercicio(ex);
    id_exercicio_em_edicao = id;
    limpar_todos_erros();

    const inputNome = document.getElementById("campo_ex_nome");
    const inputPrValor = document.getElementById("campo_ex_pr_valor");
    const inputPrUnidade = document.getElementById("campo_ex_pr_unidade");
    const inputBwValor = document.getElementById("campo_ex_bw_pr_valor");
    const inputBwUnidade = document.getElementById("campo_ex_bw_pr_unidade");
    const inputPrMes = document.getElementById("campo_ex_pr_mes");
    const inputPrDia = document.getElementById("campo_ex_pr_dia");
    const inputPrAno = document.getElementById("campo_ex_pr_ano");
    const inputDescricao = document.getElementById("campo_ex_descricao");
    const inputLink = document.getElementById("campo_ex_link");
    const tituloForm = document.getElementById("titulo_form_exercicio");
    const btnGuardar = document.getElementById("btn_guardar_exercicio");

    if (inputNome) inputNome.value = ex.nome || "";
    if (inputPrValor) inputPrValor.value = ex.pr_valor || "";
    if (inputPrUnidade) inputPrUnidade.value = ex.pr_unidade || UNIDADES_PR[0];
    if (inputBwValor) inputBwValor.value = ex.bw_at_pr || "";
    if (inputBwUnidade) inputBwUnidade.value = ex.bw_at_pr_unidade || "Kg";
    if (inputPrMes) inputPrMes.value = ex.pr_month || "";
    if (inputPrDia) inputPrDia.value = ex.pr_day || "";
    if (inputPrAno) inputPrAno.value = ex.pr_year || "";
    atualizar_limite_dia_pr();
    if (inputDescricao) inputDescricao.value = ex.descricao || "";
    if (inputLink) inputLink.value = ex.link || "";

    definir_categorias_selecionadas(ex.categorias || [ex.categoria]);
    definir_musculos_selecionados(ex.musculos || [ex.musculo]);

    if (tituloForm) tituloForm.textContent = `Edit Exercise: ${ex.nome}`;
    if (btnGuardar) btnGuardar.textContent = "Update Exercise";

    atualizar_contador_caracteres();
    alternar_form_exercicio(true);

    const painel = document.getElementById("painel_form_exercicio");
    if (painel) painel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function cancelar_edicao_exercicio() {
    id_exercicio_em_edicao = null;
    limpar_formulario_exercicio();
    alternar_form_exercicio(false);
}

function limpar_formulario_exercicio() {
    id_exercicio_em_edicao = null;
    limpar_todos_erros();

    const inputNome = document.getElementById("campo_ex_nome");
    const inputPrValor = document.getElementById("campo_ex_pr_valor");
    const inputPrUnidade = document.getElementById("campo_ex_pr_unidade");
    const inputBwValor = document.getElementById("campo_ex_bw_pr_valor");
    const inputBwUnidade = document.getElementById("campo_ex_bw_pr_unidade");
    const inputPrMes = document.getElementById("campo_ex_pr_mes");
    const inputPrDia = document.getElementById("campo_ex_pr_dia");
    const inputPrAno = document.getElementById("campo_ex_pr_ano");
    const inputDescricao = document.getElementById("campo_ex_descricao");
    const inputLink = document.getElementById("campo_ex_link");
    const tituloForm = document.getElementById("titulo_form_exercicio");
    const btnGuardar = document.getElementById("btn_guardar_exercicio");

    if (inputNome) inputNome.value = "";
    if (inputPrValor) inputPrValor.value = "";
    if (inputPrUnidade) inputPrUnidade.selectedIndex = 0;
    if (inputBwValor) inputBwValor.value = "";
    if (inputBwUnidade) inputBwUnidade.value = "Kg";
    if (inputPrMes) inputPrMes.value = "";
    if (inputPrDia) inputPrDia.value = "";
    if (inputPrAno) inputPrAno.value = "";
    atualizar_limite_dia_pr();
    if (inputDescricao) inputDescricao.value = "";
    if (inputLink) inputLink.value = "";

    limpar_checkboxes_selecionados();

    if (tituloForm) tituloForm.textContent = "Add New Exercise";
    if (btnGuardar) btnGuardar.textContent = "Save Exercise";

    atualizar_contador_caracteres();
}

function atualizar_contador_caracteres() {
    const inputDesc = document.getElementById("campo_ex_descricao");
    const contador = document.getElementById("contador_caracteres_descricao");
    if (!inputDesc || !contador) return;

    const total = inputDesc.value.length;
    contador.textContent = `${total} / 300 characters`;

    if (total >= 280) {
        contador.style.color = "#c0392b";
        contador.style.fontWeight = "bold";
    } else {
        contador.style.color = "#555";
        contador.style.fontWeight = "normal";
    }
}

/* ==========================================================================
   REMOÇÃO DE EXERCÍCIOS (botão em cada exercício da lista)
   ========================================================================== */

function remover_exercicio_dicionario(id) {
    const ex = lista_exercicios_global.find(e => e.id === id);
    if (!ex) return;

    const confirmar = confirm(`Tens a certeza que queres remover "${ex.nome}" do dicionário?`);
    if (!confirmar) return;

    exercicios_selecionados_busca_tempo.delete(String(id));
    atualizar_contador_busca_tempo();
    lista_exercicios_global = lista_exercicios_global.filter(e => e.id !== id);
    salvar_exercicios_storage();

    if (id_exercicio_em_edicao === id) {
        cancelar_edicao_exercicio();
    }

    filtrar_exercicios_dicionario();
}


/* ==========================================================================
   PESQUISA E FILTROS NA BARRA HORIZONTAL
   ========================================================================== */

function filtrar_exercicios_dicionario() {
    const inputPesquisa = document.getElementById("filtro_pesquisa_exercicio");

    const termo = inputPesquisa ? inputPesquisa.value.toLowerCase().trim() : "";

    const resultados = lista_exercicios_global.filter(ex => {
        normalizar_exercicio(ex);

        const nome = (ex.nome || "").toLowerCase();
        const desc = (ex.descricao || "").toLowerCase();
        const cats = (ex.categorias || [ex.categoria || ""]).map(c => c.toLowerCase());
        const muscs = (ex.musculos || [ex.musculo || ""]).map(m => m.toLowerCase());

        const matchNome = nome.includes(termo);
        const matchDesc = desc.includes(termo);
        const matchCat = cats.some(c => c.includes(termo));
        const matchMusc = muscs.some(m => m.includes(termo));
        const matchPesquisa = !termo || matchNome || matchDesc || matchCat || matchMusc;

        const categoriasExercicio = ex.categorias || [];
        const musculosExercicio = ex.musculos || [];
        const matchCategorias = [...filtros_dicionario_categorias].every(filtro =>
            categoriasExercicio.some(categoria => normalizar_opcao(categoria) === normalizar_opcao(filtro))
        );
        const matchMusculos = [...filtros_dicionario_musculos].every(filtro =>
            musculosExercicio.some(musculo => normalizar_opcao(musculo) === normalizar_opcao(filtro))
        );

        return matchPesquisa && matchCategorias && matchMusculos;
    });

    renderizar_lista_exercicios(resultados);
}

function limpar_filtros_dicionario() {
    const inputPesquisa = document.getElementById("filtro_pesquisa_exercicio");

    if (inputPesquisa) inputPesquisa.value = "";
    filtros_dicionario_categorias.clear();
    filtros_dicionario_musculos.clear();

    renderizar_chips_filtros_dicionario();
    filtrar_exercicios_dicionario();
}

/* ==========================================================================
   RENDERIZAÇÃO DA LISTA VERTICAL DE EXERCÍCIOS
   ========================================================================== */

function renderizar_lista_exercicios(exercicios) {
    const container = document.getElementById("lista_vertical_exercicios");
    const textoContador = document.getElementById("contador_exercicios_dic");
    if (!container) return;

    if (textoContador) {
        textoContador.textContent = `${exercicios.length} exercise(s) found`;
    }

    container.innerHTML = "";

    if (exercicios.length === 0) {
        container.innerHTML = `
            <div class="msg_lista_vazia">
                <p class="msg_lista_vazia_titulo">No exercises found.</p>
                <span>Try clearing the search filters or click <strong>"+ Add Exercise"</strong> to register one.</span>
            </div>
        `;
        return;
    }

    exercicios.forEach(ex => {
        normalizar_exercicio(ex);

        const linha_card = document.createElement("div");
        linha_card.className = "linha_card_exercicio";

        const selecao = document.createElement("input");
        selecao.type = "checkbox";
        selecao.className = "selecao_busca_tempo";
        selecao.checked = exercicios_selecionados_busca_tempo.has(String(ex.id));
        selecao.setAttribute("aria-label", `Select ${ex.nome} for Search through time`);
        selecao.addEventListener("change", () => {
            const chave = String(ex.id);
            if (selecao.checked && !exercicios_selecionados_busca_tempo.has(chave) &&
                exercicios_selecionados_busca_tempo.size >= 3) {
                selecao.checked = false;
                return;
            }
            if (selecao.checked) exercicios_selecionados_busca_tempo.add(chave);
            else exercicios_selecionados_busca_tempo.delete(chave);
            atualizar_contador_busca_tempo();
        });

        const card = document.createElement("div");
        card.classList.add("card_exercicio_dicionario");
        card.id = `card_ex_${ex.id}`;

        const prFormatado = (ex.pr_valor !== undefined && ex.pr_valor !== "" && ex.pr_valor !== null)
            ? `${ex.pr_valor} ${ex.pr_unidade || ""}${formatar_forca_relativa_pr(ex)}`
            : "None";
        const bwPrFormatado = ex.bw_at_pr !== undefined && ex.bw_at_pr !== "" && ex.bw_at_pr !== null
            ? `${ex.bw_at_pr} ${ex.bw_at_pr_unidade || "Kg"}`
            : "None";

        const temLink = ex.link && ex.link.trim().length > 0;
        let linkHtml = "";
        if (temLink) {
            let url = ex.link.trim();
            if (!/^https?:\/\//i.test(url)) {
                url = "https://" + url;
            }
            linkHtml = `
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="link_video_ex" title="Open exercise reference/video">
                    🎬 Watch Video / Link
                </a>
            `;
        }

        // Gera badges para todas as categorias selecionadas
        const cats = Array.isArray(ex.categorias) && ex.categorias.length > 0
            ? ex.categorias
            : (ex.categoria ? [ex.categoria] : []);
        const badgesCatHtml = cats.map(c => `<span class="badge_categoria" title="Category">${escapeHtml(c)}</span>`).join(" ");

        // Gera badges para todos os músculos selecionados
        const muscs = Array.isArray(ex.musculos) && ex.musculos.length > 0
            ? ex.musculos
            : (ex.musculo ? [ex.musculo] : []);
        const badgesMuscHtml = muscs.map(m => `<span class="badge_musculo" title="Target Muscle">${escapeHtml(m)}</span>`).join(" ");

        card.innerHTML = `
            <div class="card_ex_topo">
                <div class="card_ex_info_principal">
                    <span class="card_ex_nome">${escapeHtml(ex.nome)}</span>
                    <div class="card_ex_tags">
                        ${badgesCatHtml}
                        ${badgesMuscHtml}
                        <span class="badge_pr" title="Personal Record">🏆 PR: ${escapeHtml(prFormatado)}</span>
                        <span class="badge_pr_detalhe">BW at PR: ${escapeHtml(bwPrFormatado)}</span>
                        <span class="badge_pr_detalhe">PR date: ${escapeHtml(formatar_data_pr(ex))}</span>
                    </div>
                </div>
                <div class="card_ex_acoes">
                    <button class="btn_card_edit" onclick="iniciar_edicao_exercicio(${ex.id})" title="Edit this exercise">✏️ Edit</button>
                    <button class="btn_card_delete" onclick="remover_exercicio_dicionario(${ex.id})" title="Remove this exercise">🗑️ Remove</button>
                </div>
            </div>
            ${ex.descricao ? `<div class="card_ex_descricao">${escapeHtml(ex.descricao)}</div>` : ""}
            ${temLink ? `<div class="card_ex_rodape">${linkHtml}</div>` : ""}
        `;

        linha_card.append(selecao, card);
        container.appendChild(linha_card);
    });
    atualizar_contador_busca_tempo();
}

function atualizar_contador_busca_tempo() {
    const botao = document.getElementById("btn_busca_tempo");
    if (botao) botao.textContent = `🕒 Search through time ${exercicios_selecionados_busca_tempo.size}/3`;
}

function escapeHtml(texto) {
    if (texto === undefined || texto === null) return "";
    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ==========================================================================
   AUTO-EXECUÇÃO
   ========================================================================== */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializar_menu_exercicios);
} else {
    inicializar_menu_exercicios();
}