const tela_calculadora = document.getElementById("tela_calculadora");
const METERS_PER_INCH = 0.0254;
const CENTIMETERS_PER_INCH = 2.54;
const KILOGRAMS_PER_POUND = 0.45359237;
const STORAGE_TIPTOE = "calculator_jump_tiptoe";
const unidades_tiptoe = { frames: "cm", time: "cm" };
const unidades_peso = { "1rm": "Kg", reps: "Kg", target: "Kg" };

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

function calcular_reps() {
    const oneRepMax = ler_valor_calculadora("daily-1rm");
    const weight = ler_valor_calculadora("weight-reps");
    const muscles = ler_valor_calculadora("muscles-reps");
    const factor = fator_reps_calculadora(muscles);
    if (oneRepMax === null || weight === null || oneRepMax <= 0 || weight <= 0 || factor === null) {
        definir_resultado_calculadora("reps", "Maximum reps: Enter valid values to calculate.");
        return;
    }
    if (weight > oneRepMax) {
        definir_resultado_calculadora("reps", "Maximum reps: Weight cannot exceed the 1RM.");
        return;
    }
    const reps = (oneRepMax - weight) / (factor * weight);
    const percentage = weight * 100 / oneRepMax;
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

function calcular_dri() {
    const fallHeight = ler_valor_calculadora("dri-fall-height");
    const fps = ler_valor_calculadora("dri-fps");
    const firstContact = ler_valor_calculadora("dri-contact");
    const takeoff = ler_valor_calculadora("dri-takeoff");
    const landing = ler_valor_calculadora("dri-landing");
    if (fallHeight === null || fps === null || fps <= 0 ||
        firstContact === null || takeoff === null || landing === null ||
        takeoff <= firstContact || landing <= takeoff) {
        definir_resultado_calculadora("dri", "DRI: Enter valid values (contact < takeoff < landing) and an FPS greater than zero.");
        return;
    }

    const fallUnit = document.querySelector('[data-calc="dri-height-unit"]').value;
    const fallHeightMeters = fallUnit === "in" ? fallHeight * METERS_PER_INCH : fallHeight;
    const groundContactTime = (takeoff - firstContact) / fps;
    const flightTime = (landing - takeoff) / fps;
    const ballisticJumpHeight = (flightTime / 2) ** 2 * 4.905;
    const dri = (fallHeightMeters + ballisticJumpHeight) / (9.80655 * (groundContactTime ** 2));
    definir_resultado_calculadora("dri", `DRI: ${formatar_resultado_calculadora(dri)}`);
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
    if (["unit-1rm", "unit-reps", "unit-target"].includes(nome)) {
        if (event.type !== "change") return;
        const calculo = nome === "unit-1rm" ? "1rm" : nome === "unit-reps" ? "reps" : "target";
        const unidadeAnterior = unidades_peso[calculo];
        const unidadeNova = campo.value;
        const camposPeso = calculo === "1rm"
            ? ["weight-1rm", "bw-1rm"]
            : calculo === "reps"
                ? ["daily-1rm", "weight-reps"]
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
        return;
    }
    if (nome === "dri-height-unit") {
        if (event.type !== "change") return;
        const campoAltura = document.querySelector('[data-calc="dri-fall-height"]');
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
        calcular_dri();
        return;
    }
    if (["jump-tip-frames", "jump-tip-time"].includes(nome)) guardar_valores_tiptoe();
    if (["reps-1rm", "rir", "weight-1rm", "bw-1rm", "unit-1rm", "muscles-1rm"].includes(nome)) {
        calcular_1rm();
    } else if (["daily-1rm", "weight-reps", "unit-reps", "muscles-reps"].includes(nome)) {
        calcular_reps();
    } else if (["target-1rm", "target-reps", "target-rir", "unit-target", "muscles-target"].includes(nome)) {
        calcular_peso_alvo();
    } else if (["rsi-contact", "rsi-takeoff", "rsi-landing"].includes(nome)) {
        calcular_rsi_frames();
    } else if (["rsi-flight", "rsi-ground"].includes(nome)) {
        calcular_rsi_tempo();
    } else if (["dri-fall-height", "dri-fps", "dri-contact", "dri-takeoff", "dri-landing"].includes(nome)) {
        calcular_dri();
    } else if (["jump-fps", "jump-takeoff", "jump-landing", "jump-tip-frames", "jump-unit-frames"].includes(nome)) {
        calcular_altura_salto("frames");
    } else if (["jump-flight", "jump-tip-time", "jump-unit-time"].includes(nome)) {
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
