const FORMATO_BACKUP = "BuildAnAthlete backup";
const VERSAO_BACKUP = 1;
const CHAVE_COPIA_SEGURANCA_IMPORTACAO = "build_an_athlete_backup_antes_da_importacao";

function recolher_dados_backup() {
    const dados = {};

    for (let indice = 0; indice < localStorage.length; indice++) {
        const chave = localStorage.key(indice);
        if (chave && chave !== CHAVE_COPIA_SEGURANCA_IMPORTACAO) {
            dados[chave] = localStorage.getItem(chave);
        }
    }

    return dados;
}

function criar_backup(dados = recolher_dados_backup()) {
    return {
        formato: FORMATO_BACKUP,
        versao: VERSAO_BACKUP,
        exportadoEm: new Date().toISOString(),
        dados
    };
}

function descarregar_backup_no_navegador(blob, nomeFicheiro) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = nomeFicheiro;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function pode_partilhar_ficheiro(ficheiro) {
    if (typeof navigator.share !== "function" || !ficheiro) return false;
    if (typeof navigator.canShare !== "function") return true;

    try {
        return navigator.canShare({ files: [ficheiro] });
    } catch {
        return false;
    }
}

function plugins_nativos_backup() {
    const capacitor = window.Capacitor;
    if (!capacitor || typeof capacitor.isNativePlatform !== "function" || !capacitor.isNativePlatform()) {
        return null;
    }

    const plugins = capacitor.Plugins || {};
    const obter = nome => plugins[nome] || (typeof capacitor.registerPlugin === "function" ? capacitor.registerPlugin(nome) : null);
    const filesystem = obter("Filesystem");
    const share = obter("Share");
    return filesystem && share ? { filesystem, share } : null;
}

function partilha_cancelada(erro) {
    return !!erro && (erro.name === "AbortError" || /cancel|dismiss/i.test(String(erro.message || erro)));
}

async function partilhar_backup_nativo(conteudo, nomeFicheiro) {
    const plugins = plugins_nativos_backup();
    if (!plugins) return false;

    const suporte = await plugins.share.canShare();
    if (!suporte.value) return false;

    const ficheiro = await plugins.filesystem.writeFile({
        path: nomeFicheiro,
        data: conteudo,
        // CACHE = pasta privada da app: é sempre gravável e o Share consegue partilhá-la.
        // (DOCUMENTS falha no Android 10+ por causa do scoped storage.)
        directory: "CACHE",
        encoding: "utf8"
    });

    await plugins.share.share({
        title: "BuildAnAthlete backup",
        text: "Backup da BuildAnAthlete",
        files: [ficheiro.uri],
        dialogTitle: "Exportar backup"
    });
    return true;
}

async function descarregar_backup(backup) {
    const conteudo = JSON.stringify(backup, null, 2);
    const data = new Date().toISOString().slice(0, 10);
    const nomeFicheiro = `backup-treinos-${data}.json`;

    // No APK Capacitor, usa APIs nativas em vez de links blob do WebView.
    if (await partilhar_backup_nativo(conteudo, nomeFicheiro)) return "partilhado";

    // O WebView do Android ignora downloads por link: se estamos na app nativa e chegámos aqui,
    // faltam os plugins (ou a partilha não está disponível) e é preferível avisar a falhar em silêncio.
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()) {
        throw new Error("A partilha nativa não está disponível. Confirma que correste 'npx cap sync' e voltaste a compilar a app.");
    }

    const blob = new Blob([conteudo], { type: "application/json" });
    const ficheiro = typeof File === "function"
        ? new File([blob], nomeFicheiro, { type: "application/json" })
        : null;

    // Em browsers móveis, a folha de partilha permite guardar em Ficheiros, Drive ou enviar por mensagem.
    if (pode_partilhar_ficheiro(ficheiro)) {
        try {
            await navigator.share({
                files: [ficheiro],
                title: "BuildAnAthlete backup",
                text: "Backup da BuildAnAthlete"
            });
            return "partilhado";
        } catch (erro) {
            if (partilha_cancelada(erro)) throw erro;
        }
    }

    descarregar_backup_no_navegador(blob, nomeFicheiro);
    return "descarregado";
}

async function exportar_backup() {
    try {
        await descarregar_backup(criar_backup());
    } catch (erro) {
        if (partilha_cancelada(erro)) return;
        console.error("Não foi possível exportar o backup:", erro);
        const detalhe = erro && erro.message ? `\n\n${erro.message}` : "";
        alert(`Não foi possível criar o ficheiro de backup.${detalhe}`);
    }
}

function abrir_seletor_importacao() {
    const campo = document.getElementById("ficheiro_importacao_backup");
    campo.value = "";
    campo.click();
}

function validar_backup(backup) {
    if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
        throw new Error("O ficheiro não contém um backup válido.");
    }
    if (backup.formato !== FORMATO_BACKUP || backup.versao !== VERSAO_BACKUP) {
        throw new Error("Este ficheiro não é um backup compatível com a app.");
    }
    if (typeof backup.exportadoEm !== "string" || Number.isNaN(Date.parse(backup.exportadoEm))) {
        throw new Error("A data do backup é inválida.");
    }
    if (!backup.dados || typeof backup.dados !== "object" || Array.isArray(backup.dados)) {
        throw new Error("Os dados do backup são inválidos.");
    }

    for (const [chave, valor] of Object.entries(backup.dados)) {
        if (!chave || chave === CHAVE_COPIA_SEGURANCA_IMPORTACAO || typeof valor !== "string") {
            throw new Error("O backup contém dados num formato inválido.");
        }
    }
}

function substituir_dados_locais(dados) {
    const chaves_atuais = [];
    for (let indice = 0; indice < localStorage.length; indice++) {
        const chave = localStorage.key(indice);
        if (chave && chave !== CHAVE_COPIA_SEGURANCA_IMPORTACAO) chaves_atuais.push(chave);
    }

    chaves_atuais.forEach(chave => localStorage.removeItem(chave));
    Object.entries(dados).forEach(([chave, valor]) => localStorage.setItem(chave, valor));
}

async function importar_backup(evento) {
    const campo = evento.target;
    const ficheiro = campo.files && campo.files[0];
    if (!ficheiro) return;

    try {
        const backup = JSON.parse(await ficheiro.text());
        validar_backup(backup);

        const totalDados = Object.keys(backup.dados).length;
        const confirmar = confirm(
            `Importar este backup vai substituir os dados atuais por ${totalDados} itens guardados. ` +
            "Será criada uma cópia de segurança dos dados atuais neste dispositivo. Pretende continuar?"
        );
        if (!confirmar) return;

        const dadosAtuais = recolher_dados_backup();
        const copiaSeguranca = criar_backup(dadosAtuais);

        // A cópia é guardada primeiro e nunca é removida pela substituição dos dados da app.
        localStorage.setItem(CHAVE_COPIA_SEGURANCA_IMPORTACAO, JSON.stringify(copiaSeguranca));

        try {
            substituir_dados_locais(backup.dados);
        } catch (erro) {
            substituir_dados_locais(dadosAtuais);
            throw erro;
        }

        alert("Backup importado com sucesso. A app será recarregada.");
        window.location.reload();
    } catch (erro) {
        console.error("Não foi possível importar o backup:", erro);
        alert(erro && erro.message ? erro.message : "Não foi possível importar este ficheiro.");
    } finally {
        campo.value = "";
    }
}