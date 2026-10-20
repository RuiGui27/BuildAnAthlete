const tela_calculadora = document.getElementById("tela_calculadora");
const METERS_PER_INCH = 0.0254;
const CENTIMETERS_PER_INCH = 2.54;
const KILOGRAMS_PER_POUND = 0.45359237;
const STORAGE_TIPTOE = "calculator_jump_tiptoe";
const unidades_tiptoe = { frames: "cm", time: "cm" };
const unidades_peso = { "1rm": "Kg", reps: "Kg", target: "Kg" };
const unidades_forca_relativa = { weight: "Kg", bw: "Kg" };
const unidades_weight_reps = { weight: "Kg" };
const CAMPOS_DECIMAIS = ["rel-weight", "rel-bw", "wp-weight1", "wp-perc1", "wp-weight2", "wp-perc2"];

function restaurar_valores_tiptoe() {
    const guardado = localStorage.getItem(STORAGE_TIPTOE);
    if (!guardado) return;

    const valores = JSON.parse(guardado);
    if (!valores || typeof valores !== "object") return;
    ["frames", "time"].forEach(metodo => {
        const dados = valores[metodo];
        if (!dados || !["cm", "in"].includes(dados.unit)) return;

        const campo = document.querySelector(`[data-calc="jump-tip-${metodo}"]`);
        const seletor = document.querySelector(`[data-calc="jump-unit-${metodo}"]`);
        if (typeof dados.value === "string" && dados.value !== "" && Number.isFinite(Number(dados.value)) && Number(dados.value) >= 0) {
            campo.value = dados.value;
        }
        seletor.value = dados.unit;
        unidades_tiptoe[metodo] = dados.unit;
    });
}

function guardar_valores_tiptoe() {
    const valores = {};
    ["frames", "time"].forEach(metodo => {
        valores[metodo] = {
            value: document.querySelector(`[data-calc="jump-tip-${metodo}"]`).value,
            unit: document.querySelector(`[data-calc="jump-unit-${metodo}"]`).value
        };
    });
    localStorage.setItem(STORAGE_TIPTOE, JSON.stringify(valores));
}

function abrir_calculadora() {
    tela_calculadora.style.display = "flex";
    tela_calculadora.setAttribute("aria-hidden", "false");
    document.getElementById("fechar_calculadora").focus();
}

function fechar_calculadora() {
    tela_calculadora.style.display = "none";
    tela_calculadora.setAttribute("aria-hidden", "true");
    document.getElementById("botao_calculadora").focus();
}

function ler_valor_calculadora(nome) {
    const campo = document.querySelector(`[data-calc="${nome}"]`);
    if (!campo || campo.value.trim() === "") return null;
    const valor = Number(campo.value);
    return Number.isFinite(valor) && valor >= 0 ? valor : null;
}

function formatar_resultado_calculadora(valor) {
    return Number(valor.toFixed(2)).toString();
}

function converter_peso_calculadora(valor, unidadeAnterior, unidadeNova) {
    const convertido = unidadeAnterior === "Kg"
        ? valor / KILOGRAMS_PER_POUND
        : valor * KILOGRAMS_PER_POUND;
    return String(Number(convertido.toFixed(4)));
}

function fator_reps_calculadora(musculos) {
    if (!Number.isInteger(musculos) || musculos < 1) return null;
    if (musculos <= 3) return 0.03333;
    if (musculos <= 5) return 0.045;
    return 0.0725;
}

function definir_resultado_calculadora(nome, texto) {
    const resultado = document.querySelector(`[data-result="${nome}"]`);
    if (resultado) resultado.textContent = texto;
}

function calcular_1rm() {
    const reps = ler_valor_calculadora("reps-1rm");
    const rir = ler_valor_calculadora("rir");
    const weight = ler_valor_calculadora("weight-1rm");
    const bwCampo = document.querySelector('[data-calc="bw-1rm"]');
    const bw = bwCampo.value.trim() === "" ? null : ler_valor_calculadora("bw-1rm");
    const muscles = ler_valor_calculadora("muscles-1rm");
    const factor = fator_reps_calculadora(muscles);
    if (reps === null || rir === null || weight === null || weight <= 0 || factor === null || reps < 0 || rir < 0 ||
        (bwCampo.value.trim() !== "" && (bw === null || bw <= 0))) {
        definir_resultado_calculadora("1rm", "1RM: Enter valid values to calculate.");
        return;
    }
    const oneRepMax = factor * (reps + rir) * weight + weight;
    const unit = document.querySelector('[data-calc="unit-1rm"]').value;
    const resultado = `${formatar_resultado_calculadora(oneRepMax)} ${unit}`;
    const forcaRelativa = bw === null ? "" : ` -> ${formatar_resultado_calculadora(oneRepMax / bw)} BW`;
    definir_resultado_calculadora("1rm", `1RM: ${resultado}${forcaRelativa}`);
}

function peso_reps_na_unidade_rm(peso, unidadePeso, unidadeRM, oneRepMax) {
    if (unidadePeso === "%") return peso / 100 * oneRepMax;
    if (unidadePeso === unidadeRM) return peso;
    return unidadeRM === "Lb" ? peso / KILOGRAMS_PER_POUND : peso * KILOGRAMS_PER_POUND;
}

function calcular_reps() {
    const oneRepMax = ler_valor_calculadora("daily-1rm");
    const weight = ler_valor_calculadora("weight-reps");
    const muscles = ler_valor_calculadora("muscles-reps");
    const factor = fator_reps_calculadora(muscles);
    if (oneRepMax === null || weight === null || oneRepMax <= 0 || weight <= 0 || factor === null) {
        definir_resultado_calculadora("reps", "Maximum reps: Enter valid values to calculate.");
        return;
    }
    const unidadeRM = document.querySelector('[data-calc="unit-reps"]').value;
    const unidadePeso = document.querySelector('[data-calc="unit-reps-weight"]').value;
    const pesoRM = peso_reps_na_unidade_rm(weight, unidadePeso, unidadeRM, oneRepMax);
    if (pesoRM > oneRepMax) {
        definir_resultado_calculadora("reps", "Maximum reps: Weight cannot exceed the 1RM.");
        return;
    }
    const reps = (oneRepMax - pesoRM) / (factor * pesoRM);
    const percentage = pesoRM * 100 / oneRepMax;
    definir_resultado_calculadora(
        "reps",
        `${formatar_resultado_calculadora(reps)} reps @ ${formatar_resultado_calculadora(percentage)}%`
    );
}

function calcular_peso_alvo() {
    const oneRepMax = ler_valor_calculadora("target-1rm");
    const reps = ler_valor_calculadora("target-reps");
    const rir = ler_valor_calculadora("target-rir");
    const muscles = ler_valor_calculadora("muscles-target");
    const factor = fator_reps_calculadora(muscles);
    if (oneRepMax === null || oneRepMax <= 0 || reps === null || rir === null || factor === null) {
        definir_resultado_calculadora("target-weight", "Weight: Enter valid values to calculate.");
        return;
    }
    const rirFactor = muscles <= 3 ? 0.03333 : factor;
    const weight = oneRepMax / (reps * factor + rir * rirFactor + 1);
    const percentage = weight * 100 / oneRepMax;
    const unit = document.querySelector('[data-calc="unit-target"]').value;
    definir_resultado_calculadora(
        "target-weight",
        `Weight: ${formatar_resultado_calculadora(weight)} ${unit} -> ${formatar_resultado_calculadora(percentage)}%`
    );
}

function calcular_peso_percentagem() {
    const campos = {
        weight1: ler_valor_calculadora("wp-weight1"),
        perc1: ler_valor_calculadora("wp-perc1"),
        weight2: ler_valor_calculadora("wp-weight2"),
        perc2: ler_valor_calculadora("wp-perc2")
    };
    const preenchidos = Object.keys(campos).filter(chave => campos[chave] !== null);
    if (preenchidos.length === 4) {
        definir_resultado_calculadora("weight-percentage", "Weight or percentage: Only 3 of the 4 fields can be filled. Leave one empty.");
        return;
    }
    if (preenchidos.length < 3) {
        definir_resultado_calculadora("weight-percentage", "Weight or percentage: Enter 3 of the 4 fields to calculate.");
        return;
    }
    if (preenchidos.some(chave => campos[chave] <= 0)) {
        definir_resultado_calculadora("weight-percentage", "Weight or percentage: Values must be greater than zero.");
        return;
    }
    const vazio = Object.keys(campos).find(chave => campos[chave] === null);
    let nome;
    let valor;
    if (vazio === "weight1") {
        nome = "Weight 1";
        valor = campos.weight2 * campos.perc1 / campos.perc2;
    } else if (vazio === "perc1") {
        nome = "%1";
        valor = campos.perc2 * campos.weight1 / campos.weight2;
    } else if (vazio === "weight2") {
        nome = "Weight 2";
        valor = campos.weight1 * campos.perc2 / campos.perc1;
    } else {
        nome = "%2";
        valor = campos.perc1 * campos.weight2 / campos.weight1;
    }
    definir_resultado_calculadora("weight-percentage", `Weight or percentage: ${nome} = ${formatar_resultado_calculadora(valor)}`);
}

function calcular_forca_relativa() {
    const peso = ler_valor_calculadora("rel-weight");
    const bw = ler_valor_calculadora("rel-bw");
    if (peso === null || bw === null || bw <= 0) {
        definir_resultado_calculadora("relative", "Relative strength: Enter valid values to calculate.");
        return;
    }
    const unidadePeso = document.querySelector('[data-calc="unit-rel-weight"]').value;
    const unidadeBw = document.querySelector('[data-calc="unit-rel-bw"]').value;
    const pesoKg = unidadePeso === "Lb" ? peso * KILOGRAMS_PER_POUND : peso;
    const bwKg = unidadeBw === "Lb" ? bw * KILOGRAMS_PER_POUND : bw;
    definir_resultado_calculadora("relative", `Relative strength: ${formatar_resultado_calculadora(pesoKg / bwKg)}`);
}

function calcular_rsi_frames() {
    const firstContact = ler_valor_calculadora("rsi-contact");
    const takeoff = ler_valor_calculadora("rsi-takeoff");
    const landing = ler_valor_calculadora("rsi-landing");
    if (firstContact === null || takeoff === null || landing === null || takeoff <= firstContact || landing <= takeoff) {
        definir_resultado_calculadora("rsi-frames", "RSI: Enter valid frames (contact < takeoff < landing).");
        return;
    }
    definir_resultado_calculadora("rsi-frames", `RSI: ${formatar_resultado_calculadora((landing - takeoff) / (takeoff - firstContact))}`);
}

function calcular_rsi_tempo() {
    const flight = ler_valor_calculadora("rsi-flight");
    const ground = ler_valor_calculadora("rsi-ground");
    if (flight === null || ground === null || flight <= 0 || ground <= 0) {
        definir_resultado_calculadora("rsi-time", "RSI: Enter valid times greater than zero.");
        return;
    }
    definir_resultado_calculadora("rsi-time", `RSI: ${formatar_resultado_calculadora(flight / ground)}`);
}

function calcular_dri(metodo) {
    const usandoFrames = metodo === "frames";
    const resultadoNome = `dri-${metodo}`;
    const fallHeight = ler_valor_calculadora(`dri-fall-${metodo}`);
    const fallUnit = document.querySelector(`[data-calc="dri-unit-${metodo}"]`).value;
    let flightTime;
    let groundContactTime;

    if (usandoFrames) {
        const fps = ler_valor_calculadora("dri-fps");
        const firstContact = ler_valor_calculadora("dri-contact");
        const takeoff = ler_valor_calculadora("dri-takeoff");
        const landing = ler_valor_calculadora("dri-landing");
        if (fps === null || fps <= 0 || firstContact === null || takeoff === null || landing === null ||
            takeoff <= firstContact || landing <= takeoff) {
            definir_resultado_calculadora(resultadoNome, "DRI: Enter valid frames (contact < takeoff < landing) and an FPS greater than zero.");
            return;
        }
        groundContactTime = (takeoff - firstContact) / fps;
        flightTime = (landing - takeoff) / fps;
    } else {
        flightTime = ler_valor_calculadora("dri-flight");
        groundContactTime = ler_valor_calculadora("dri-ground");
        if (groundContactTime === null) {
            groundContactTime = ler_valor_calculadora("rsi-ground");
        }
        if (flightTime === null || flightTime <= 0 || groundContactTime === null || groundContactTime <= 0) {
            definir_resultado_calculadora(resultadoNome, "DRI: Enter a valid flight time and ground contact time.");
            return;
        }
    }

    if (fallHeight === null) {
        definir_resultado_calculadora(resultadoNome, "DRI: Enter a valid fall height.");
        return;
    }

    let tiptoe = ler_valor_calculadora(`dri-tip-${metodo}`);
    let tiptoeUnit = null;
    const driTipUnitEl = document.querySelector(`[data-calc="dri-tip-unit-${metodo}"]`);
    if (tiptoe !== null && driTipUnitEl) {
        tiptoeUnit = driTipUnitEl.value;
    }
    if (tiptoe === null) {
        tiptoe = ler_valor_calculadora(usandoFrames ? "jump-tip-frames" : "jump-tip-time");
        if (tiptoe !== null) {
            tiptoeUnit = document.querySelector(`[data-calc="jump-unit-${metodo}"]`).value;
        }
    }
    if (tiptoe === null) {
        const outroMetodo = usandoFrames ? "time" : "frames";
        tiptoe = ler_valor_calculadora(`dri-tip-${outroMetodo}`);
        if (tiptoe !== null) {
            const el = document.querySelector(`[data-calc="dri-tip-unit-${outroMetodo}"]`);
            if (el) tiptoeUnit = el.value;
        }
        if (tiptoe === null) {
            tiptoe = ler_valor_calculadora(`jump-tip-${outroMetodo}`);
            if (tiptoe !== null) {
                tiptoeUnit = document.querySelector(`[data-calc="jump-unit-${outroMetodo}"]`).value;
            }
        }
    }

    const fallHeightMeters = fallUnit === "in" ? fallHeight * METERS_PER_INCH : fallHeight;
    const tiptoeMeters = tiptoe !== null
        ? (tiptoeUnit === "in" ? tiptoe * CENTIMETERS_PER_INCH / 100 : tiptoe / 100)
        : 0;
    const dri = (fallHeightMeters + (flightTime / 2) ** 2 * 4.905 + tiptoeMeters) / (9.80655 * (groundContactTime ** 2));
    definir_resultado_calculadora(resultadoNome, `DRI: ${formatar_resultado_calculadora(dri)}`);
}

function calcular_altura_salto(metodo) {
    const usandoFrames = metodo === "frames";
    const unit = document.querySelector(`[data-calc="jump-unit-${metodo}"]`).value;
    const tiptoe = ler_valor_calculadora(usandoFrames ? "jump-tip-frames" : "jump-tip-time");
    let flightTime;

    if (usandoFrames) {
        const fps = ler_valor_calculadora("jump-fps");
        const takeoff = ler_valor_calculadora("jump-takeoff");
        const landing = ler_valor_calculadora("jump-landing");
        if (fps === null || takeoff === null || landing === null || fps <= 0 || landing <= takeoff) {
            definir_resultado_calculadora("jump-frames", "Jump height: Enter valid frames and an FPS greater than zero.");
            return;
        }
        flightTime = (landing - takeoff) / fps;
    } else {
        flightTime = ler_valor_calculadora("jump-flight");
        if (flightTime === null || flightTime <= 0) {
            definir_resultado_calculadora("jump-time", "Jump height: Enter a flight time greater than zero.");
            return;
        }
    }

    const resultName = usandoFrames ? "jump-frames" : "jump-time";
    if (tiptoe === null || tiptoe < 0) {
        definir_resultado_calculadora(resultName, "Jump height: Enter a valid tiptoe height difference.");
        return;
    }
    const tiptoeMeters = unit === "in"
        ? tiptoe * CENTIMETERS_PER_INCH / 100
        : tiptoe / 100;
    const heightMeters = (flightTime / 2) ** 2 * 4.905 + tiptoeMeters;
    const height = unit === "in"
        ? heightMeters / METERS_PER_INCH
        : heightMeters * 100;
    definir_resultado_calculadora(resultName, `Jump height: ${formatar_resultado_calculadora(height)} ${unit}`);
}

function atualizar_calculadora(event) {
    const campo = event.target.closest("[data-calc]");
    if (!campo) return;
    const nome = campo.dataset.calc;
    if (["muscles-1rm", "muscles-reps", "muscles-target"].includes(nome) && campo.value && !/^\d+$/.test(campo.value)) {
        campo.value = "";
    }
    if (CAMPOS_DECIMAIS.includes(nome)) {
        const limpo = campo.value.replace(/,/g, ".").replace(/[^0-9.]/g, "");
        const partes = limpo.split(".");
        const sanitizado = partes.length > 2 ? `${partes[0]}.${partes.slice(1).join("")}` : limpo;
        if (campo.value !== sanitizado) campo.value = sanitizado;
    }
    if (nome === "unit-rel-weight" || nome === "unit-rel-bw") {
        if (event.type !== "change") return;
        const chave = nome === "unit-rel-weight" ? "weight" : "bw";
        const nomeCampo = chave === "weight" ? "rel-weight" : "rel-bw";
        const campoValor = document.querySelector(`[data-calc="${nomeCampo}"]`);
        const unidadeAnterior = unidades_forca_relativa[chave];
        const unidadeNova = campo.value;
        const envolveW = unidadeAnterior === "W" || unidadeNova === "W";
        if (campoValor.value !== "" && !envolveW) {
            campoValor.value = converter_peso_calculadora(Number(campoValor.value), unidadeAnterior, unidadeNova);
        }
        unidades_forca_relativa[chave] = unidadeNova;
        calcular_forca_relativa();
        return;
    }
    if (["unit-1rm", "unit-reps", "unit-target"].includes(nome)) {
        if (event.type !== "change") return;
        const calculo = nome === "unit-1rm" ? "1rm" : nome === "unit-reps" ? "reps" : "target";
        const unidadeAnterior = unidades_peso[calculo];
        const unidadeNova = campo.value;
        const camposPeso = calculo === "1rm"
            ? ["weight-1rm", "bw-1rm"]
            : calculo === "reps"
                ? ["daily-1rm"]
                : ["target-1rm"];
        camposPeso.forEach(nomeCampo => {
            const campoPeso = document.querySelector(`[data-calc="${nomeCampo}"]`);
            if (campoPeso.value !== "") {
                campoPeso.value = converter_peso_calculadora(
                    Number(campoPeso.value),
                    unidadeAnterior,
                    unidadeNova
                );
            }
        });
        unidades_peso[calculo] = unidadeNova;
        if (calculo === "1rm") calcular_1rm();
        else if (calculo === "reps") calcular_reps();
        else calcular_peso_alvo();
        return;
    }
    if (nome === "jump-unit-frames" || nome === "jump-unit-time") {
        if (event.type !== "change") return;
        const metodo = nome === "jump-unit-frames" ? "frames" : "time";
        const unidadeAnterior = unidades_tiptoe[metodo];
        const unidadeNova = campo.value;
        const nomeCampoTiptoe = metodo === "frames" ? "jump-tip-frames" : "jump-tip-time";
        const tiptoeCampo = document.querySelector(`[data-calc="${nomeCampoTiptoe}"]`);
        if (tiptoeCampo.value !== "") {
            const valorAnterior = Number(tiptoeCampo.value);
            const fatorConversao = unidadeAnterior === "in"
                ? CENTIMETERS_PER_INCH
                : 1 / CENTIMETERS_PER_INCH;
            tiptoeCampo.value = String(Number((valorAnterior * fatorConversao).toFixed(4)));
        }
        unidades_tiptoe[metodo] = unidadeNova;
        guardar_valores_tiptoe();
        calcular_altura_salto(metodo);
        calcular_dri(metodo);
        return;
    }
    if (nome === "dri-unit-frames" || nome === "dri-unit-time") {
        if (event.type !== "change") return;
        const metodo = nome === "dri-unit-frames" ? "frames" : "time";
        const campoAltura = document.querySelector(`[data-calc="dri-fall-${metodo}"]`);
        const unidadeNova = campo.value;
        const unidadeAnterior = campo.dataset.unit || "meters";
        if (campoAltura.value !== "") {
            const altura = Number(campoAltura.value);
            const convertida = unidadeAnterior === "in"
                ? altura * METERS_PER_INCH
                : altura / METERS_PER_INCH;
            campoAltura.value = String(Number(convertida.toFixed(4)));
        }
        campo.dataset.unit = unidadeNova;
        calcular_dri(metodo);
        return;
    }
    if (nome === "dri-tip-unit-frames" || nome === "dri-tip-unit-time") {
        if (event.type !== "change") return;
        const metodo = nome === "dri-tip-unit-frames" ? "frames" : "time";
        const campoTip = document.querySelector(`[data-calc="dri-tip-${metodo}"]`);
        if (campoTip && campoTip.value !== "") {
            const valorAnterior = Number(campoTip.value);
            const unidadeAnterior = campo.dataset.prevUnit || "cm";
            const fatorConversao = unidadeAnterior === "in"
                ? CENTIMETERS_PER_INCH
                : 1 / CENTIMETERS_PER_INCH;
            campoTip.value = String(Number((valorAnterior * fatorConversao).toFixed(4)));
        }
        campo.dataset.prevUnit = campo.value;
        calcular_dri(metodo);
        return;
    }

    if (nome === "unit-reps-weight") {
        if (event.type !== "change") return;
        const unidadeAnterior = unidades_weight_reps.weight;
        const unidadeNova = campo.value;
        const campoPeso = document.querySelector('[data-calc="weight-reps"]');
        const envolvePercentagem = unidadeAnterior === "%" || unidadeNova === "%";
        if (campoPeso.value !== "" && !envolvePercentagem) {
            campoPeso.value = converter_peso_calculadora(Number(campoPeso.value), unidadeAnterior, unidadeNova);
        }
        unidades_weight_reps.weight = unidadeNova;
        calcular_reps();
        return;
    }

    if (["jump-tip-frames", "jump-tip-time"].includes(nome)) {
        guardar_valores_tiptoe();
    }

    if (["wp-weight1", "wp-perc1", "wp-weight2", "wp-perc2"].includes(nome)) {
        calcular_peso_percentagem();
    }
    if (["rel-weight", "rel-bw"].includes(nome)) {
        calcular_forca_relativa();
    }
    if (["reps-1rm", "rir", "weight-1rm", "bw-1rm", "unit-1rm", "muscles-1rm"].includes(nome)) {
        calcular_1rm();
    }
    if (["daily-1rm", "weight-reps", "unit-reps", "muscles-reps"].includes(nome)) {
        calcular_reps();
    }
    if (["target-1rm", "target-reps", "target-rir", "unit-target", "muscles-target"].includes(nome)) {
        calcular_peso_alvo();
    }
    if (["rsi-contact", "rsi-takeoff", "rsi-landing"].includes(nome)) {
        calcular_rsi_frames();
    }
    if (["rsi-flight", "rsi-ground"].includes(nome)) {
        calcular_rsi_tempo();
    }
    if (["dri-fall-frames", "dri-fps", "dri-contact", "dri-takeoff", "dri-landing", "dri-tip-frames", "jump-tip-frames", "jump-unit-frames", "jump-tip-time", "jump-unit-time"].includes(nome)) {
        calcular_dri("frames");
    }
    if (["dri-fall-time", "dri-flight", "dri-ground", "rsi-ground", "dri-tip-time", "jump-tip-time", "jump-unit-time", "jump-tip-frames", "jump-unit-frames"].includes(nome)) {
        calcular_dri("time");
    }
    if (["jump-fps", "jump-takeoff", "jump-landing", "jump-tip-frames", "jump-unit-frames"].includes(nome)) {
        calcular_altura_salto("frames");
    }
    if (["jump-flight", "jump-tip-time", "jump-unit-time"].includes(nome)) {
        calcular_altura_salto("time");
    }
}

restaurar_valores_tiptoe();
document.getElementById("tela_calculadora").addEventListener("input", atualizar_calculadora);
document.getElementById("tela_calculadora").addEventListener("change", atualizar_calculadora);
document.getElementById("tela_calculadora").addEventListener("click", event => {
    if (event.target === tela_calculadora) fechar_calculadora();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && tela_calculadora.style.display === "flex") fechar_calculadora();
});