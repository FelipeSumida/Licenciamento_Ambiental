const API_URL = "http://localhost:5161/api";

let processoAtual = null;
let arquivosFasesTrecho = [];


document.addEventListener(
    "DOMContentLoaded",
    () => {

        carregarProcesso();

    }
);


async function carregarProcesso() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const id =
        parametros.get("id");


    if (!id) {

        mostrarErro();

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/processos/${id}`
            );


        if (!response.ok) {

            throw new Error(
                `Erro HTTP ${response.status}`
            );

        }


        processoAtual =
            await response.json();


        preencherFormulario(
            processoAtual
        );


        document
            .getElementById("voltarProcesso")
            .href =
            `./processo.html?id=${processoAtual.id}`;


        document
            .getElementById("carregando")
            .hidden = true;


        document
            .getElementById("formProcesso")
            .hidden = false;


        configurarBotoes();

    }
    catch (error) {

        console.error(
            "Erro ao carregar processo:",
            error
        );

        mostrarErro();

    }

}


function preencherFormulario(processo) {

    document
        .getElementById("idEmpreendimento")
        .value =
        processo.idEmpreendimento ?? "";


    document
        .getElementById(
            "identificacaoEmpreendimento"
        )
        .value =
        processo.identificacaoEmpreendimento
        ?? "";


    document
        .getElementById(
            "caracterizacaoEmpreendimento"
        )
        .value =
        processo.caracterizacaoEmpreendimento
        ?? "";


    document
        .getElementById("empreendimento")
        .value =
        processo.empreendimento ?? "";


    document
        .getElementById("interessado")
        .value =
        processo.interessado ?? "";


    preencherTecnicosResponsaveis(
        processo.tecnicoResponsavel
    );

    renderizarTrechosEdicao(
        processo.trechos ?? []
    );

    renderizarPendenciasEdicao(
        processo.pendencias ?? []
    );

    document
        .getElementById("historicoProcessoData")
        .value =
        normalizarDataInput(
            processo.historicoProcessoData
        );


    document
        .getElementById("historicoProcessoTexto")
        .value =
        processo.historicoProcessoTexto ?? "";

}

function preencherTecnicosResponsaveis(valor) {

    const container =
        document.getElementById(
            "listaTecnicos"
        );

    const tecnicos =
        String(valor ?? "")
            .split(";")
            .map(nome => nome.trim())
            .filter(nome => nome !== "");

    container.innerHTML = "";

    const nomes =
        tecnicos.length > 0
            ? tecnicos
            : [""];

    nomes.forEach(
        (nome, index) => {

            const bloco =
                document.createElement("div");

            bloco.className =
                "tecnico-responsavel-item";

            bloco.innerHTML = `
                <input
                    type="text"
                    class="tecnico-responsavel"
                    ${index === 0
                        ? 'id="tecnicoResponsavel"'
                        : ""}
                    value="${escapeHtml(nome)}"
                    placeholder="Digite o nome do técnico"
                >

                ${
                    index > 0
                        ? `
                            <button
                                type="button"
                                class="button-danger btn-remover-tecnico"
                            >
                                Remover
                            </button>
                        `
                        : ""
                }
            `;

            const btnRemover =
                bloco.querySelector(
                    ".btn-remover-tecnico"
                );

            btnRemover?.addEventListener(
                "click",
                () => {
                    bloco.remove();
                }
            );

            container.appendChild(bloco);
        }
    );
}

function configurarFaseAtual(card) {

    const selectStatus =
        card.querySelector(".fase-status");

    const blocoEmitido =
        card.querySelector(
            ".fase-dados-emitidos"
        );


    if (
        !selectStatus ||
        !blocoEmitido
    ) {
        return;
    }


    function atualizarVisibilidade() {

        const emitido =
            selectStatus.value ===
            "Emitido";

        blocoEmitido.hidden =
            !emitido;

    }


    selectStatus.addEventListener(
        "change",
        atualizarVisibilidade
    );

    atualizarVisibilidade();
}

document.addEventListener("click", (event) => {

    const botao =
        event.target.closest(
            ".btn-finalizar-fase"
        );

    if (!botao) {
        return;
    }


    event.preventDefault();


    const cardAtual =
        botao.closest(
            ".edit-fase-card"
        );


    if (!cardAtual) {

        console.error(
            "Card da fase atual não encontrado."
        );

        return;
    }


    finalizarFase(
        cardAtual
    );

});

document.addEventListener("click", (event) => {

    const btnAdicionar =
        event.target.closest(
            ".btn-adicionar-fase-complementar"
        );


    if (btnAdicionar) {

        const trechoCard =
            btnAdicionar.closest(
                ".edit-trecho-card"
            );

        const lista =
            trechoCard.querySelector(
                ".lista-fases-complementares"
            );


        lista.insertAdjacentHTML(
            "beforeend",
            criarFaseComplementarHtml()
        );

        configurarSelectsCustomizados();

        return;
    }


    const btnRemover =
        event.target.closest(
            ".btn-remover-fase-complementar"
        );


    if (btnRemover) {

        btnRemover
            .closest(
                ".fase-complementar-item"
            )
            ?.remove();

    }

});

function lerFaseDoCard(card) {

    return {

        id:
            Number(
                card.querySelector(
                    ".fase-id"
                )?.value ?? 0
            ),

        ordem:
            Number(
                card.querySelector(
                    ".fase-ordem"
                )?.value ?? 1
            ),

        fase:
            card.querySelector(
                ".fase-tipo"
            )?.value ?? "",

        numeroProcesso:
            card.querySelector(
                ".fase-numero-processo"
            )?.value?.trim() ?? "",

        numeroLicenciamento:
            card.querySelector(
                ".fase-numero-licenciamento"
            )?.value?.trim() ?? "",

        statusFase:
            card.querySelector(
                ".fase-status"
            )?.value ?? "",

        numeroFase:
            card.querySelector(
                ".fase-numero"
            )?.value?.trim() ?? "",

        dataEmissaoFase:
            card.querySelector(
                ".fase-data-emissao"
            )?.value || null,

        dataValidadeFase:
            card.querySelector(
                ".fase-data-validade"
            )?.value || null

    };
}

function finalizarFase(cardAtual) {

    const fase =
        lerFaseDoCard(cardAtual);


    if (
        fase.statusFase !== "Emitido"
    ) {

        alert(
            "A fase só pode ser finalizada quando estiver Emitida."
        );

        return;
    }


    if (!fase.fase) {

        alert(
            "Selecione a fase."
        );

        return;
    }

    const lista =
        cardAtual.closest(
            ".lista-fases-edicao"
        );


    const quantidadePassadas =
        lista.querySelectorAll(
            ".fase-passada-card"
        ).length;

    const wrapperPassada =
        document.createElement("div");

    wrapperPassada.innerHTML =
        criarFasePassadaHtml(
            fase,
            quantidadePassadas + 1
        ).trim();


    const cardPassada =
        wrapperPassada.firstElementChild;


    cardAtual.replaceWith(
        cardPassada
    );


    const novaFase = {

        id: 0,

        ordem:
            Number(fase.ordem) + 1,

        fase: "",

        numeroProcesso: "",

        numeroLicenciamento: "",

        statusFase:
            "Em andamento",

        numeroFase: "",

        dataEmissaoFase: null,

        dataValidadeFase: null

    };


    const wrapperAtual =
        document.createElement("div");

    wrapperAtual.innerHTML =
        criarFaseAtualHtml(
            novaFase,
            quantidadePassadas + 1
        ).trim();


    const novoCardAtual =
        wrapperAtual.firstElementChild;


    lista.appendChild(
        novoCardAtual
    );


    configurarFaseAtual(
        novoCardAtual
    );

    configurarSelectsCustomizados();

}

function criarFaseAtualHtml(fase, faseIndex) {

    const emitido =
        fase.statusFase === "Emitido";

    const nomeAnexo =
        fase.anexoFase ||
        "";

    return `
        <div
            class="edit-fase-card fase-atual-card"
            data-fase-index="${faseIndex}"
            data-fase-atual="true"
        >

            <input
                type="hidden"
                class="fase-id"
                value="${fase.id ?? 0}"
            >

            <input
                type="hidden"
                class="fase-ordem"
                value="${fase.ordem ?? faseIndex + 1}"
            >


            <div class="edit-section-header">

                <h5 class="fase-titulo">
                    Fase atual
                </h5>

            </div>


            <div class="form-grid form-grid-4">

                <div class="form-field">

                    <label>Fase</label>

                    <select class="fase-tipo">
                        ${criarOpcoesFase(
                            fase.fase
                        )}
                    </select>

                </div>


                <div class="form-field">

                    <label>
                        Número do processo
                    </label>

                    <input
                        type="text"
                        class="fase-numero-processo"
                        value="${escapeHtml(
                            fase.numeroProcesso ?? ""
                        )}"
                    >

                </div>


                <div class="form-field">

                    <label>
                        Nº do licenciamento
                    </label>

                    <input
                        type="text"
                        class="fase-numero-licenciamento"
                        value="${escapeHtml(
                            fase.numeroLicenciamento ?? ""
                        )}"
                    >

                </div>


                <div class="form-field">

                    <label>Situação</label>

                    <select class="fase-status">
                        ${criarOpcoesStatus(
                            fase.statusFase
                        )}
                    </select>

                </div>

            </div>


            <div
                class="fase-dados-emitidos"
                ${emitido ? "" : "hidden"}
            >

                <div class="form-grid form-grid-3">

                    <div class="form-field">

                        <label>
                            Nº da fase
                        </label>

                        <input
                            type="text"
                            class="fase-numero"
                            value="${escapeHtml(
                                fase.numeroFase ?? ""
                            )}"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Data de emissão
                        </label>

                        <input
                            type="date"
                            class="fase-data-emissao"
                            value="${normalizarDataInput(
                                fase.dataEmissaoFase
                            )}"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Data de validade
                        </label>

                        <input
                            type="date"
                            class="fase-data-validade"
                            value="${normalizarDataInput(
                                fase.dataValidadeFase
                            )}"
                        >

                    </div>

                </div>


                <div class="form-field fase-anexo-container">

                    <label>
                        Anexo
                    </label>

                    <input
                        type="file"
                        class="fase-anexo"
                        accept=".pdf,application/pdf"
                    >

                    ${
                        nomeAnexo
                            ? `
                                <div class="arquivo-preservado">
                                    Arquivo atual:
                                    <strong>
                                        ${escapeHtml(nomeAnexo)}
                                    </strong>
                                </div>
                            `
                            : ""
                    }

                </div>


                <div class="fase-acoes">

                    <button
                        type="button"
                        class="button-secondary btn-finalizar-fase"
                    >
                        Finalizar fase
                    </button>

                </div>

            </div>

        </div>
    `;
}

function criarFasePassadaHtml(
    fase,
    numeroPassada
) {

    const emitida =
        fase.statusFase === "Emitido";

    const nomeAnexo =
        fase.anexoFase ||
        "";

    return `
        <div
            class="edit-fase-card fase-passada-card"
            data-fase-atual="false"
        >

            <input
                type="hidden"
                class="fase-id"
                value="${fase.id ?? 0}"
            >

            <input
                type="hidden"
                class="fase-ordem"
                value="${fase.ordem ?? numeroPassada}"
            >

            <input
                type="hidden"
                class="fase-tipo"
                value="${escapeHtml(
                    fase.fase ?? ""
                )}"
            >

            <input
                type="hidden"
                class="fase-numero-processo"
                value="${escapeHtml(
                    fase.numeroProcesso ?? ""
                )}"
            >

            <input
                type="hidden"
                class="fase-numero-licenciamento"
                value="${escapeHtml(
                    fase.numeroLicenciamento ?? ""
                )}"
            >

            <input
                type="hidden"
                class="fase-status"
                value="${escapeHtml(
                    fase.statusFase ?? ""
                )}"
            >

            <input
                type="hidden"
                class="fase-numero"
                value="${escapeHtml(
                    fase.numeroFase ?? ""
                )}"
            >

            <input
                type="hidden"
                class="fase-data-emissao"
                value="${normalizarDataInput(
                    fase.dataEmissaoFase
                )}"
            >

            <input
                type="hidden"
                class="fase-data-validade"
                value="${normalizarDataInput(
                    fase.dataValidadeFase
                )}"
            >

            <input
                type="hidden"
                class="fase-anexo-nome"
                value="${escapeHtml(nomeAnexo)}"
            >


            <div class="edit-section-header">

                <h5 class="fase-titulo-passada">
                    Fase passada ${numeroPassada}
                </h5>

                ${
                    emitida
                        ? `
                            <div class="fase-passada-acoes">

                                <button
                                    type="button"
                                    class="button-secondary btn-editar-fase-passada"
                                >
                                    Editar
                                </button>

                                <button
                                    type="button"
                                    class="button-danger btn-excluir-fase-passada"
                                >
                                    Excluir
                                </button>

                            </div>
                        `
                        : ""
                }

            </div>


            <div class="fase-passada-visualizacao">

                <div class="fase-passada-grid">

                    <div>
                        <span class="detail-label">
                            FASE
                        </span>

                        <strong>
                            ${escapeHtml(
                                fase.fase || "—"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span class="detail-label">
                            NÚMERO DO PROCESSO
                        </span>

                        <strong>
                            ${escapeHtml(
                                fase.numeroProcesso || "—"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span class="detail-label">
                            Nº DO LICENCIAMENTO
                        </span>

                        <strong>
                            ${escapeHtml(
                                fase.numeroLicenciamento || "—"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span class="detail-label">
                            SITUAÇÃO
                        </span>

                        <strong>
                            ${escapeHtml(
                                fase.statusFase || "—"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span class="detail-label">
                            Nº DA FASE
                        </span>

                        <strong>
                            ${escapeHtml(
                                fase.numeroFase || "—"
                            )}
                        </strong>
                    </div>


                    <div>
                        <span class="detail-label">
                            DATA DE EMISSÃO
                        </span>

                        <strong>
                            ${
                                fase.dataEmissaoFase
                                    ? formatarData(
                                        fase.dataEmissaoFase
                                    )
                                    : "—"
                            }
                        </strong>
                    </div>


                    <div>
                        <span class="detail-label">
                            DATA DE VALIDADE
                        </span>

                        <strong>
                            ${
                                fase.dataValidadeFase
                                    ? formatarData(
                                        fase.dataValidadeFase
                                    )
                                    : "—"
                            }
                        </strong>
                    </div>

                    ${
                        emitida
                            ? `
                                <div>
                                    <span class="detail-label">
                                        ANEXO
                                    </span>

                                    <strong>
                                        ${
                                            nomeAnexo
                                                ? escapeHtml(nomeAnexo)
                                                : "—"
                                        }
                                    </strong>
                                </div>
                            `
                            : ""
                    }

                </div>

            </div>


            <div
                class="fase-passada-edicao"
                hidden
            >

                <div class="form-grid form-grid-4">

                    <div class="form-field">

                        <label>Fase</label>

                        <select class="fase-passada-edicao-tipo">
                            ${criarOpcoesFase(
                                fase.fase
                            )}
                        </select>

                    </div>


                    <div class="form-field">

                        <label>
                            Número do processo
                        </label>

                        <input
                            type="text"
                            class="fase-passada-edicao-numero-processo"
                            value="${escapeHtml(
                                fase.numeroProcesso ?? ""
                            )}"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Nº do licenciamento
                        </label>

                        <input
                            type="text"
                            class="fase-passada-edicao-numero-licenciamento"
                            value="${escapeHtml(
                                fase.numeroLicenciamento ?? ""
                            )}"
                        >

                    </div>


                    <div class="form-field">

                        <label>Situação</label>

                        <input
                            type="text"
                            value="Emitido"
                            disabled
                        >

                    </div>

                </div>


                <div class="form-grid form-grid-3">

                    <div class="form-field">

                        <label>
                            Nº da fase
                        </label>

                        <input
                            type="text"
                            class="fase-passada-edicao-numero"
                            value="${escapeHtml(
                                fase.numeroFase ?? ""
                            )}"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Data de emissão
                        </label>

                        <input
                            type="date"
                            class="fase-passada-edicao-data-emissao"
                            value="${normalizarDataInput(
                                fase.dataEmissaoFase
                            )}"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Data de validade
                        </label>

                        <input
                            type="date"
                            class="fase-passada-edicao-data-validade"
                            value="${normalizarDataInput(
                                fase.dataValidadeFase
                            )}"
                        >

                    </div>

                </div>


                <div class="form-field fase-passada-edicao-anexo-container">

                    <label>
                        Anexo
                    </label>

                    <input
                        type="file"
                        class="fase-passada-edicao-anexo"
                        accept=".pdf,application/pdf"
                    >

                    ${
                        nomeAnexo
                            ? `
                                <div class="arquivo-preservado">
                                    Arquivo atual:
                                    <strong>
                                        ${escapeHtml(nomeAnexo)}
                                    </strong>
                                </div>
                            `
                            : ""
                    }

                </div>


                <div class="fase-passada-edicao-acoes">

                    <button
                        type="button"
                        class="button-secondary btn-cancelar-edicao-fase-passada"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="button-primary btn-salvar-edicao-fase-passada"
                    >
                        Salvar edição
                    </button>

                </div>

            </div>

        </div>
    `;
}

function reordenarFasesDaLista(lista) {

    const todosCards =
        Array.from(
            lista.querySelectorAll(
                ".edit-fase-card"
            )
        );


    todosCards.forEach(
        (card, index) => {

            const inputOrdem =
                card.querySelector(
                    ".fase-ordem"
                );

            if (inputOrdem) {
                inputOrdem.value =
                    String(index + 1);
            }

        }
    );


    lista
        .querySelectorAll(
            ".fase-passada-card"
        )
        .forEach(
            (card, index) => {

                const titulo =
                    card.querySelector(
                        ".fase-titulo-passada"
                    );

                if (titulo) {
                    titulo.textContent =
                        `Fase passada ${index + 1}`;
                }

            }
        );
}

document.addEventListener(
    "click",
    (event) => {

        const btnEditar =
            event.target.closest(
                ".btn-editar-fase-passada"
            );

        if (btnEditar) {

            const card =
                btnEditar.closest(
                    ".fase-passada-card"
                );

            card
                .querySelector(
                    ".fase-passada-visualizacao"
                )
                .hidden = true;

            card
                .querySelector(
                    ".fase-passada-edicao"
                )
                .hidden = false;

            return;
        }


        const btnCancelar =
            event.target.closest(
                ".btn-cancelar-edicao-fase-passada"
            );

        if (btnCancelar) {

            const card =
                btnCancelar.closest(
                    ".fase-passada-card"
                );

            card
                .querySelector(
                    ".fase-passada-edicao"
                )
                .hidden = true;

            card
                .querySelector(
                    ".fase-passada-visualizacao"
                )
                .hidden = false;

            return;
        }


        const btnSalvar =
            event.target.closest(
                ".btn-salvar-edicao-fase-passada"
            );

        if (btnSalvar) {

            const card =
                btnSalvar.closest(
                    ".fase-passada-card"
                );

            const lista =
                card.closest(
                    ".lista-fases-edicao"
                );

            const arquivoNovo =
                card.querySelector(
                    ".fase-passada-edicao-anexo"
                )?.files?.[0] ?? null;

            const nomeAnexoAtual =
                card.querySelector(
                    ".fase-anexo-nome"
                )?.value ?? "";


            const faseAtualizada = {

                id:
                    Number(
                        card.querySelector(
                            ".fase-id"
                        )?.value ?? 0
                    ),

                ordem:
                    Number(
                        card.querySelector(
                            ".fase-ordem"
                        )?.value ?? 1
                    ),

                fase:
                    card.querySelector(
                        ".fase-passada-edicao-tipo"
                    )?.value ?? "",

                numeroProcesso:
                    card.querySelector(
                        ".fase-passada-edicao-numero-processo"
                    )?.value?.trim() ?? "",

                numeroLicenciamento:
                    card.querySelector(
                        ".fase-passada-edicao-numero-licenciamento"
                    )?.value?.trim() ?? "",

                statusFase:
                    "Emitido",

                numeroFase:
                    card.querySelector(
                        ".fase-passada-edicao-numero"
                    )?.value?.trim() ?? "",

                dataEmissaoFase:
                    card.querySelector(
                        ".fase-passada-edicao-data-emissao"
                    )?.value || null,

                dataValidadeFase:
                    card.querySelector(
                        ".fase-passada-edicao-data-validade"
                    )?.value || null,

                anexoFase:
                    arquivoNovo
                        ? arquivoNovo.name
                        : nomeAnexoAtual

            };


            if (!faseAtualizada.fase) {

                alert(
                    "Selecione a fase."
                );

                return;
            }


            const passadas =
                Array.from(
                    lista.querySelectorAll(
                        ".fase-passada-card"
                    )
                );

            const numeroPassada =
                passadas.indexOf(card) + 1;

            const faseIndex =
                passadas.indexOf(card);

            const trechoCard =
                card.closest(
                    ".edit-trecho-card"
                );

            const cardsTrechos =
                Array.from(
                    document.querySelectorAll(
                        ".edit-trecho-card"
                    )
                );

            const trechoIndex =
                cardsTrechos.indexOf(
                    trechoCard
                );


            if (
                arquivoNovo &&
                trechoIndex >= 0 &&
                faseIndex >= 0
            ) {

                arquivosFasesTrecho[
                    trechoIndex
                ] ??= [];

                arquivosFasesTrecho[
                    trechoIndex
                ][
                    faseIndex
                ] = arquivoNovo;

            }


            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.innerHTML =
                criarFasePassadaHtml(
                    faseAtualizada,
                    numeroPassada
                ).trim();


            card.replaceWith(
                wrapper.firstElementChild
            );

            return;
        }


        const btnExcluir =
            event.target.closest(
                ".btn-excluir-fase-passada"
            );

        if (btnExcluir) {

            const card =
                btnExcluir.closest(
                    ".fase-passada-card"
                );

            const confirmar =
                window.confirm(
                    "Deseja realmente excluir esta fase emitida?"
                );

            if (!confirmar) {
                return;
            }


            const lista =
                card.closest(
                    ".lista-fases-edicao"
                );

            card.remove();

            reordenarFasesDaLista(
                lista
            );

        }

    }
);

function criarFaseComplementarHtml(fase = {}) {

    return `
        <div class="fase-complementar-item">

            <input
                type="hidden"
                class="fase-complementar-id"
                value="${fase.id ?? 0}"
            >

            <div class="fase-complementar-linha">

                <div class="form-field fase-complementar-campo-fase">

                    <label>Fase</label>

                    <select class="fase-complementar-tipo">

                        <option value="">
                            Selecione a fase
                        </option>

                        <option
                            value="ASV"
                            ${fase.fase === "ASV" ? "selected" : ""}
                        >
                            ASV
                        </option>

                        <option
                            value="TCRA"
                            ${fase.fase === "TCRA" ? "selected" : ""}
                        >
                            TCRA
                        </option>

                        <option
                            value="AMIS"
                            ${fase.fase === "AMIS" ? "selected" : ""}
                        >
                            AMIS
                        </option>

                    </select>

                </div>


                <div class="form-field fase-complementar-campo-data">

                    <label>
                        Data de emissão
                    </label>

                    <input
                        type="date"
                        class="fase-complementar-data"
                        value="${normalizarDataInput(
                            fase.data ?? fase.dataEmissao ?? ""
                        )}"
                    >

                </div>


                <div class="form-field fase-complementar-campo-anexo">

                    <label>
                        Anexo
                    </label>

                    <input
                        type="hidden"
                        class="fase-complementar-anexo-atual"
                        value="${escapeHtml(
                            fase.anexoPdf || ""
                        )}"
                    >

                    <input
                        type="file"
                        class="fase-complementar-anexo"
                        accept="application/pdf"
                    >

                    ${
                        fase.anexoPdf && fase.id
                            ? `
                                <div class="fase-complementar-arquivo-atual">

                                    <span>
                                        Arquivo atual:
                                    </span>

                                    <a
                                        href="${API_URL}/processos/fases-complementares/${fase.id}/anexo"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        ${escapeHtml(
                                            fase.anexoPdf
                                        )}
                                    </a>

                                </div>
                            `
                            : ""
                    }

                </div>


                <div class="fase-complementar-campo-excluir">

                    <button
                        type="button"
                        class="button-danger btn-remover-fase-complementar"
                    >
                        Excluir
                    </button>

                </div>

            </div>

        </div>
    `;
}

function renderizarTrechosEdicao(
    trechos,
    limparContainer = true,
    indiceInicial = 0
) {

    const container =
        document.getElementById(
            "listaTrechosEdicao"
        );

    if (limparContainer) {
        container.innerHTML = "";
    }


    if (
        limparContainer &&
        trechos.length === 0
    ) {

        container.innerHTML = `
            <p class="muted-text">
                Nenhum trecho cadastrado.
            </p>
        `;

        return;
    }


    trechos.forEach(
        (trecho, trechoIndex) => {

            const indiceReal =
                indiceInicial + trechoIndex;

            const blocoTrecho =
                document.createElement("div");

            blocoTrecho.className =
                "edit-trecho-card";


            const fases =
                [...(trecho.fases ?? [])]
                    .sort(
                        (a, b) =>
                            Number(a.ordem ?? 0) -
                            Number(b.ordem ?? 0)
                    );

            if (fases.length === 0) {

                fases.push({
                    id: 0,
                    ordem: 1,
                    fase: "",
                    numeroProcesso: "",
                    numeroLicenciamento: "",
                    statusFase: "Em andamento",
                    numeroFase: "",
                    dataEmissaoFase: null,
                    dataValidadeFase: null
                });

            }


            blocoTrecho.innerHTML = `

                <div class="edit-section-header">
                    <h3>
                        Trecho ${indiceReal + 1}
                    </h3>
                </div>


                <input
                    type="hidden"
                    class="trecho-id"
                    value="${trecho.id ?? 0}"
                >

                <input
                    type="hidden"
                    class="trecho-rod-id"
                    value="${trecho.rodId ?? trecho.rodovia?.rodId ?? 0}"
                >


                <div class="rodovias-km-bloco">

                    <div class="rodovias-km-card">

                        <div class="rodovias-km-grid">

                            <div class="form-field">

                                <label>
                                    Código
                                </label>

                                <div class="rodovia-autocomplete">

                                    <input
                                        type="text"
                                        class="trecho-rodovia"
                                        value="${escapeHtml(
                                            trecho.rodovia?.rodCodigo ?? ""
                                        )}"
                                        data-km-inicial="${trecho.rodovia?.rodKmInicial ?? ""}"
                                        data-km-final="${trecho.rodovia?.rodKmFinal ?? ""}"
                                        autocomplete="off"
                                        placeholder="Digite o código..."
                                    >

                                    <div
                                        class="rodovia-resultados"
                                        hidden
                                    ></div>

                                </div>

                            </div>


                            <div class="form-field">

                                <label>
                                    KM Inicial
                                </label>

                                <input
                                    type="number"
                                    step="0.001"
                                    class="trecho-km-inicial"
                                    value="${trecho.kmInicial ?? ""}"
                                >

                            </div>


                            <div class="form-field">

                                <label>
                                    KM Final
                                </label>

                                <input
                                    type="number"
                                    step="0.001"
                                    class="trecho-km-final"
                                    value="${trecho.kmFinal ?? ""}"
                                >

                            </div>

                            <div
                                class="km-intervalo-aviso"
                                hidden
                            ></div>

                        </div>

                    </div>

                </div>


                <div class="edit-fases">

                    <h4>Fases do trecho</h4>

                    <div class="lista-fases-edicao">

                        ${
                            fases
                                .map(
                                    (fase, faseIndex) => {

                                        const ehAtual =
                                            faseIndex ===
                                            fases.length - 1;

                                        return ehAtual

                                            ? criarFaseAtualHtml(
                                                fase,
                                                faseIndex
                                            )

                                            : criarFasePassadaHtml(
                                                fase,
                                                faseIndex + 1
                                            );

                                    }
                                )
                                .join("")
                        }

                    </div>

                    <div class="fases-complementares-bloco">

                        <h4>
                            Fases Complementares
                        </h4>

                        <div class="lista-fases-complementares">
                        </div>

                        <div class="fase-complementar-adicionar">

                            <button
                                type="button"
                                class="button-primary btn-adicionar-fase-complementar"
                            >
                                + Adicionar Fase Complementar
                            </button>

                        </div>

                    </div>

                    <div class="trecho-acoes">

                        <button
                            type="button"
                            class="button-danger btn-excluir-trecho"
                        >
                            Excluir
                        </button>

                    </div>

                </div>
            `;

            const listaComplementares =
                blocoTrecho.querySelector(
                    ".lista-fases-complementares"
                );

            const fasesComplementares =
                Array.isArray(trecho.fasesComplementares)
                    ? trecho.fasesComplementares
                    : [];

            fasesComplementares.forEach(
                (faseComplementar) => {

                    listaComplementares.insertAdjacentHTML(
                        "beforeend",
                        criarFaseComplementarHtml(
                            faseComplementar
                        )
                    );

                }
            );


            container.appendChild(
                blocoTrecho
            );

        }
    );

    configurarBuscaRodovias();
    configurarValidacaoKmTrechos();

    document
        .querySelectorAll(
            '.edit-fase-card[data-fase-atual="true"]'
        )
        .forEach(
            card => configurarFaseAtual(card)
        );

    configurarSelectsCustomizados();

}

function configurarValidacaoKmTrechos() {

    document
        .querySelectorAll(".edit-trecho-card")
        .forEach((card) => {

            const rodovia =
                card.querySelector(
                    ".trecho-rodovia"
                );

            const kmInicialInput =
                card.querySelector(
                    ".trecho-km-inicial"
                );

            const kmFinalInput =
                card.querySelector(
                    ".trecho-km-final"
                );

            const aviso =
                card.querySelector(
                    ".km-intervalo-aviso"
                );


            if (
                !rodovia ||
                !kmInicialInput ||
                !kmFinalInput ||
                !aviso
            ) {
                return;
            }


            function validar() {

                const limiteInicialValor =
                    rodovia.dataset.kmInicial;

                const limiteFinalValor =
                    rodovia.dataset.kmFinal;


                if (
                    limiteInicialValor === undefined ||
                    limiteInicialValor === "" ||
                    limiteFinalValor === undefined ||
                    limiteFinalValor === ""
                ) {
                    aviso.hidden = true;
                    aviso.textContent = "";
                    return;
                }


                const limiteInicial =
                    Number(limiteInicialValor);

                const limiteFinal =
                    Number(limiteFinalValor);


                if (
                    Number.isNaN(limiteInicial) ||
                    Number.isNaN(limiteFinal)
                ) {
                    aviso.hidden = true;
                    aviso.textContent = "";
                    return;
                }


                const kmInicial =
                    kmInicialInput.value === ""
                        ? null
                        : Number(
                            kmInicialInput.value
                        );

                const kmFinal =
                    kmFinalInput.value === ""
                        ? null
                        : Number(
                            kmFinalInput.value
                        );


                const foraInicial =
                    kmInicial !== null &&
                    (
                        kmInicial < limiteInicial ||
                        kmInicial > limiteFinal
                    );

                const foraFinal =
                    kmFinal !== null &&
                    (
                        kmFinal < limiteInicial ||
                        kmFinal > limiteFinal
                    );


                if (
                    !foraInicial &&
                    !foraFinal
                ) {
                    aviso.hidden = true;
                    aviso.textContent = "";
                    return;
                }


                aviso.textContent =
                    `⚠ Atenção: o intervalo permitido desta rodovia é de KM ${limiteInicial} até KM ${limiteFinal}.`;

                aviso.hidden = false;

            }


            kmInicialInput.addEventListener(
                "input",
                validar
            );

            kmFinalInput.addEventListener(
                "input",
                validar
            );


            validar();

        });

}

function configurarBuscaRodovias() {

    document
        .querySelectorAll(".edit-trecho-card")
        .forEach((card) => {

            if (
                card.dataset.buscaRodoviaConfigurada ===
                "true"
            ) {
                return;
            }

            card.dataset.buscaRodoviaConfigurada =
                "true";

            const inputRodovia =
                card.querySelector(
                    ".trecho-rodovia"
                );

            const inputRodId =
                card.querySelector(
                    ".trecho-rod-id"
                );

            const listaResultados =
                card.querySelector(
                    ".rodovia-resultados"
                );


            if (
                !inputRodovia ||
                !inputRodId ||
                !listaResultados
            ) {
                return;
            }


            let rodoviasEncontradas = [];
            let timerBusca = null;
            let numeroBusca = 0;


            function fecharLista() {

                listaResultados.hidden = true;

                listaResultados.innerHTML = "";

            }


            function selecionarRodovia(
                rodovia
            ) {

                inputRodovia.value =
                    rodovia.rodCodigo ?? "";

                inputRodId.value =
                    String(
                        rodovia.rodId ?? 0
                    );


                inputRodovia.dataset.kmInicial =
                    rodovia.kmInicial ?? "";

                inputRodovia.dataset.kmFinal =
                    rodovia.kmFinal ?? "";


                fecharLista();


                const kmInicialInput =
                    card.querySelector(
                        ".trecho-km-inicial"
                    );

                const kmFinalInput =
                    card.querySelector(
                        ".trecho-km-final"
                    );


                kmInicialInput?.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                );

                kmFinalInput?.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                );

            }


            function mostrarResultados() {

                listaResultados.innerHTML = "";


                if (
                    rodoviasEncontradas.length === 0
                ) {

                    listaResultados.innerHTML = `
                        <div class="rodovia-sem-resultado">
                            Nenhum código encontrado
                        </div>
                    `;

                    listaResultados.hidden = false;

                    return;
                }


                rodoviasEncontradas.forEach(
                    (rodovia) => {

                        const botao =
                            document.createElement(
                                "button"
                            );

                        botao.type = "button";

                        botao.className =
                            "rodovia-resultado-item";

                        botao.textContent =
                            rodovia.rodCodigo ?? "";


                        botao.addEventListener(
                            "mousedown",
                            (event) => {

                                event.preventDefault();

                                selecionarRodovia(
                                    rodovia
                                );

                            }
                        );


                        listaResultados.appendChild(
                            botao
                        );

                    }
                );


                listaResultados.hidden = false;

            }


            inputRodovia.addEventListener(
                "input",
                () => {

                    inputRodId.value = "0";

                    delete inputRodovia.dataset.kmInicial;
                    delete inputRodovia.dataset.kmFinal;

                    const avisoKm =
                        card.querySelector(
                            ".km-intervalo-aviso"
                        );

                    if (avisoKm) {
                        avisoKm.hidden = true;
                        avisoKm.textContent = "";
                    }

                    clearTimeout(
                        timerBusca
                    );


                    const termo =
                        inputRodovia
                            .value
                            .trim();


                    const rodoviaSelecionada =
                        rodoviasEncontradas.find(
                            (rodovia) =>
                                String(
                                    rodovia.rodCodigo ?? ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                termo.toLowerCase()
                        );


                    if (rodoviaSelecionada) {

                        inputRodId.value =
                            String(
                                rodoviaSelecionada
                                    .rodId
                            );

                        inputRodovia.dataset.kmInicial =
                            rodoviaSelecionada.kmInicial ?? "";

                        inputRodovia.dataset.kmFinal =
                            rodoviaSelecionada.kmFinal ?? "";

                    }


                    if (termo.length < 2) {

                        rodoviasEncontradas = [];

                        fecharLista();

                        return;
                    }


                    const buscaAtual =
                        ++numeroBusca;


                    timerBusca =
                        setTimeout(
                            async () => {

                                try {

                                    const response =
                                        await fetch(
                                            `${API_URL}/processos/rodovias?busca=${encodeURIComponent(
                                                termo
                                            )}`
                                        );


                                    if (!response.ok) {

                                        throw new Error(
                                            `Erro HTTP ${response.status}`
                                        );

                                    }


                                    const dados =
                                        await response.json();


                                    if (
                                        buscaAtual !==
                                        numeroBusca
                                    ) {
                                        return;
                                    }


                                    rodoviasEncontradas =
                                        Array.isArray(
                                            dados
                                        )
                                            ? dados
                                            : [];


                                    mostrarResultados();

                                }
                                catch (error) {

                                    console.error(
                                        "Erro ao buscar rodovias:",
                                        error
                                    );

                                    fecharLista();

                                }

                            },
                            300
                        );

                }
            );


            inputRodovia.addEventListener(
                "blur",
                () => {

                    setTimeout(
                        fecharLista,
                        150
                    );

                }
            );


            inputRodovia.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key === "Escape"
                    ) {

                        fecharLista();

                    }

                }
            );

        });

}

function criarOpcoesFase(valorAtual) {

    const fases = [
        "CP",
        "LP",
        "LI",
        "LO"
    ];

    return fases
        .map((fase) => `
            <option
                value="${fase}"
                ${
                    valorAtual === fase
                        ? "selected"
                        : ""
                }
            >
                ${fase}
            </option>
        `)
        .join("");

}


function criarOpcoesStatus(valorAtual) {

    const status = [
        "Em andamento",
        "Emitido",
        "Dispensado"
    ];

    return status
        .map((item) => `
            <option
                value="${item}"
                ${
                    valorAtual === item
                        ? "selected"
                        : ""
                }
            >
                ${item}
            </option>
        `)
        .join("");

}


function normalizarDataInput(valor) {

    if (!valor) {
        return "";
    }

    return String(valor).substring(0, 10);

}

function formatarData(data) {

    if (!data) {
        return "—";
    }

    const valor =
        String(data).split("T")[0];

    const partes =
        valor.split("-");

    if (partes.length !== 3) {
        return data;
    }

    const [ano, mes, dia] =
        partes;

    return `${dia}/${mes}/${ano}`;
}

function escapeHtml(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

function renderizarPendenciasEdicao(pendencias) {

    const container =
        document.getElementById(
            "listaPendenciasEdicao"
        );

    container.innerHTML = "";


    if (pendencias.length === 0) {

        container.innerHTML = `
            <p class="muted-text">
                Nenhuma pendência cadastrada.
            </p>
        `;

        return;
    }


    pendencias.forEach(
        (pendencia, pendenciaIndex) => {

            const bloco =
                document.createElement("div");

            bloco.className =
                "edit-pendencia-card";


            bloco.innerHTML = `

                <input
                    type="hidden"
                    class="pendencia-id"
                    value="${pendencia.id ?? 0}"
                >


                <div class="edit-section-header">

                    <h3>
                        Pendência ${pendenciaIndex + 1}
                    </h3>

                    <button
                        type="button"
                        class="button-danger btn-excluir-pendencia"
                    >
                        Excluir
                    </button>

                </div>


                <div class="form-grid">

                    <div class="form-field">

                        <label>
                            Descrição
                        </label>

                        <textarea
                            class="pendencia-descricao"
                            rows="3"
                        >${escapeHtml(
                            pendencia.descricao ?? ""
                        )}</textarea>

                    </div>

                    <div class="form-field">
                        <label>Providência</label>

                        <textarea
                            class="pendencia-providencia"
                            rows="3"
                        >${escapeHtml(
                            pendencia.providencia ?? ""
                        )}</textarea>
                    </div>


                    <div class="form-field">

                        <label>
                            Divisão CAP
                        </label>

                        <select
                            class="pendencia-divisao"
                        >
                            ${criarOpcoesDivisao(
                                pendencia.divisaoCap
                            )}
                        </select>

                    </div>


                    <div class="form-field">

                        <label>
                            Situação
                        </label>

                        <select
                            class="pendencia-situacao"
                        >
                            ${criarOpcoesSituacaoPendencia(
                                pendencia.situacao
                            )}
                        </select>

                    </div>

                    <div class="form-field">

                        <label>
                            Fase vinculada
                            <small class="field-help">
                                Preencha este campo apenas depois de salvar os trechos
                            </small>
                        </label>

                        <select
                            class="pendencia-fase-vinculada"
                        >
                            ${criarOpcoesFasesVinculadas(
                                pendencia.faseTrechoId
                            )}
                        </select>

                    </div>


                    <div class="form-field">

                        <label>
                            Data de entrada
                        </label>

                        <input
                            type="date"
                            class="pendencia-data-entrada"
                            value="${normalizarDataInput(
                                pendencia.dataEntrada
                            )}"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Prazo
                        </label>

                        <input
                            type="date"
                            class="pendencia-prazo"
                            value="${normalizarDataInput(
                                pendencia.prazo
                            )}"
                        >

                    </div>


                    <div class="form-field">

                        <label>
                            Data de saída
                        </label>

                        <input
                            type="date"
                            class="pendencia-data-saida"
                            value="${normalizarDataInput(
                                pendencia.dataSaida
                            )}"
                        >

                    </div>

                </div>

                <div class="pendencia-subsecao">

                    <h4>Atribuído a</h4>

                    <div class="atribuicoes-grid atribuicoes-checkboxes">

                        ${criarCheckboxAtribuicoes(
                            pendencia.atribuidoA ?? []
                        )}

                    </div>

                </div>


                <div
                    class="pendencia-subsecao regionais-container"
                    ${
                        normalizarLista(pendencia.atribuidoA)
                            .includes("Regional")
                            ? ""
                            : "hidden"
                    }
                >

                    <h4>Regionais</h4>

                    <div class="regionais-multiselect">

                        <button
                            type="button"
                            class="regionais-trigger"
                            aria-expanded="false"
                        >
                            <span class="regionais-trigger-text">
                                Selecione as regionais
                            </span>

                            <span class="regionais-trigger-seta">
                                ▾
                            </span>
                        </button>


                        <div
                            class="regionais-dropdown"
                            hidden
                        >

                            <div class="regionais-opcoes">
                            </div>

                        </div>

                        <select
                            class="pendencia-regionais"
                            multiple
                            hidden
                        >
                            ${criarOpcoesRegionais(
                                pendencia.regionais ?? []
                            )}
                        </select>

                    </div>

                </div>


                <div class="pendencia-subsecao">

                    <div class="edit-section-header">

                        <h4>Histórico da pendência</h4>

                        <button
                            type="button"
                            class="button-primary btn-adicionar-historico"
                        >
                            + Adicionar histórico
                        </button>

                    </div>

                    <div class="lista-historicos-edicao">

                        ${criarHistoricosHtml(
                            pendencia.historicos ?? []
                        )}

                    </div>

                </div>

            `;


            container.appendChild(bloco);

        }
    );

    configurarSelectsCustomizados();
    configurarMultiselectRegionais();
    configurarInteracoesPendencias();

}

document.addEventListener(
    "click",
    (event) => {

        const btnExcluirPendencia =
            event.target.closest(
                ".btn-excluir-pendencia"
            );

        if (!btnExcluirPendencia) {
            return;
        }

        const cardPendencia =
            btnExcluirPendencia.closest(
                ".edit-pendencia-card"
            );

        if (!cardPendencia) {
            return;
        }

        const container =
            document.getElementById(
                "listaPendenciasEdicao"
            );

        cardPendencia.remove();

        container
            ?.querySelectorAll(
                ".edit-pendencia-card"
            )
            .forEach(
                (card, index) => {

                    const titulo =
                        card.querySelector(
                            ".edit-section-header h3"
                        );

                    if (titulo) {
                        titulo.textContent =
                            `Pendência ${index + 1}`;
                    }

                }
            );

        if (
            container &&
            !container.querySelector(
                ".edit-pendencia-card"
            )
        ) {

            container.innerHTML = `
                <p class="muted-text">
                    Nenhuma pendência cadastrada.
                </p>
            `;

        }

    }
);

function configurarSelectsCustomizados() {

    document
        .querySelectorAll(
            "select:not([multiple])"
        )
        .forEach((selectOriginal) => {

            if (
                selectOriginal.dataset.customizado ===
                "true"
            ) {
                return;
            }

            selectOriginal.dataset.customizado =
                "true";


            const wrapper =
                document.createElement("div");

            wrapper.className =
                "custom-select";


            const trigger =
                document.createElement("button");

            trigger.type = "button";

            trigger.className =
                "custom-select-trigger";


            const texto =
                document.createElement("span");

            texto.className =
                "custom-select-text";


            const seta =
                document.createElement("span");

            seta.className =
                "custom-select-seta";

            seta.innerHTML = "⌄";


            trigger.appendChild(texto);
            trigger.appendChild(seta);


            const dropdown =
                document.createElement("div");

            dropdown.className =
                "custom-select-dropdown";

            dropdown.hidden = true;


            function atualizarTexto() {

                const optionSelecionada =
                    selectOriginal.options[
                        selectOriginal.selectedIndex
                    ];

                texto.textContent =
                    optionSelecionada?.textContent?.trim()
                    || "Selecione";

            }


            Array.from(
                selectOriginal.options
            )
            .forEach((option) => {

                const item =
                    document.createElement("button");

                item.type = "button";

                item.className =
                    "custom-select-option";

                item.textContent =
                    option.textContent.trim();

                item.dataset.value =
                    option.value;


                if (option.disabled) {

                    item.disabled = true;

                    item.classList.add(
                        "is-disabled"
                    );

                }


                if (option.selected) {

                    item.classList.add(
                        "is-selected"
                    );

                }


                item.addEventListener(
                    "click",
                    () => {

                        selectOriginal.value =
                            option.value;


                        dropdown
                            .querySelectorAll(
                                ".custom-select-option"
                            )
                            .forEach(
                                outroItem =>
                                    outroItem.classList.remove(
                                        "is-selected"
                                    )
                            );


                        item.classList.add(
                            "is-selected"
                        );


                        atualizarTexto();


                        dropdown.hidden = true;

                        wrapper.classList.remove(
                            "is-open"
                        );


                        selectOriginal.dispatchEvent(
                            new Event(
                                "change",
                                {
                                    bubbles: true
                                }
                            )
                        );

                    }
                );


                dropdown.appendChild(
                    item
                );

            });


            trigger.addEventListener(
                "click",
                () => {

                    const estavaAberto =
                        !dropdown.hidden;


                    document
                        .querySelectorAll(
                            ".custom-select-dropdown"
                        )
                        .forEach(
                            outroDropdown => {

                                if (
                                    outroDropdown !==
                                    dropdown
                                ) {
                                    outroDropdown.hidden =
                                        true;

                                    outroDropdown
                                        .closest(
                                            ".custom-select"
                                        )
                                        ?.classList.remove(
                                            "is-open"
                                        );
                                }

                            }
                        );


                    dropdown.hidden =
                        estavaAberto;

                    wrapper.classList.toggle(
                        "is-open",
                        !estavaAberto
                    );

                }
            );


            selectOriginal.parentNode.insertBefore(
                wrapper,
                selectOriginal
            );


            wrapper.appendChild(
                trigger
            );

            wrapper.appendChild(
                dropdown
            );

            wrapper.appendChild(
                selectOriginal
            );


            selectOriginal.hidden = true;


            atualizarTexto();

        });

}

function configurarMultiselectRegionais() {

    document
        .querySelectorAll(
            ".regionais-multiselect"
        )
        .forEach((multiselect) => {

            if (
                multiselect.dataset.configurado ===
                "true"
            ) {
                return;
            }

            multiselect.dataset.configurado =
                "true";


            const trigger =
                multiselect.querySelector(
                    ".regionais-trigger"
                );

            const textoTrigger =
                multiselect.querySelector(
                    ".regionais-trigger-text"
                );

            const dropdown =
                multiselect.querySelector(
                    ".regionais-dropdown"
                );

            const lista =
                multiselect.querySelector(
                    ".regionais-opcoes"
                );

            const selectOriginal =
                multiselect.querySelector(
                    ".pendencia-regionais"
                );


            if (
                !trigger ||
                !textoTrigger ||
                !dropdown ||
                !lista ||
                !selectOriginal
            ) {
                return;
            }


            function atualizarTexto() {

                const selecionadas =
                    Array.from(
                        selectOriginal.selectedOptions
                    )
                    .map(
                        option => option.textContent.trim()
                    );


                if (selecionadas.length === 0) {

                    textoTrigger.textContent =
                        "Selecione as regionais";

                    return;
                }


                if (selecionadas.length <= 3) {

                    textoTrigger.textContent =
                        selecionadas.join(", ");

                    return;
                }


                textoTrigger.textContent =
                    `${selecionadas.length} regionais selecionadas`;

            }


            lista.innerHTML = "";


            Array.from(
                selectOriginal.options
            )
            .forEach((option) => {

                const label =
                    document.createElement(
                        "label"
                    );

                label.className =
                    "regional-opcao";


                const checkbox =
                    document.createElement(
                        "input"
                    );

                checkbox.type = "checkbox";

                checkbox.value =
                    option.value;

                checkbox.checked =
                    option.selected;


                const texto =
                    document.createElement(
                        "span"
                    );

                texto.textContent =
                    option.textContent;


                checkbox.addEventListener(
                    "change",
                    () => {

                        option.selected =
                            checkbox.checked;

                        atualizarTexto();

                        selectOriginal.dispatchEvent(
                            new Event(
                                "change",
                                {
                                    bubbles: true
                                }
                            )
                        );

                    }
                );


                label.appendChild(
                    checkbox
                );

                label.appendChild(
                    texto
                );

                lista.appendChild(
                    label
                );

            });


            trigger.addEventListener(
                "click",
                () => {

                    const aberto =
                        !dropdown.hidden;

                    document
                        .querySelectorAll(
                            ".regionais-dropdown"
                        )
                        .forEach(
                            outroDropdown => {

                                if (
                                    outroDropdown !==
                                    dropdown
                                ) {
                                    outroDropdown.hidden =
                                        true;
                                }

                            }
                        );


                    dropdown.hidden =
                        aberto;

                    trigger.setAttribute(
                        "aria-expanded",
                        String(!aberto)
                    );

                }
            );


            atualizarTexto();

        });

}

function adicionarNovaPendenciaEdicao() {

    const container =
        document.getElementById(
            "listaPendenciasEdicao"
        );

    const mensagemVazia =
        container.querySelector(".muted-text");

    if (mensagemVazia) {
        mensagemVazia.remove();
    }


    const pendenciaIndex =
        container.querySelectorAll(
            ".edit-pendencia-card"
        ).length;


    const bloco =
        document.createElement("div");

    bloco.className =
        "edit-pendencia-card";


    bloco.innerHTML = `

        <input
            type="hidden"
            class="pendencia-id"
            value="0"
        >


        <div class="edit-section-header">

            <h3>
                Pendência ${pendenciaIndex + 1}
            </h3>

            <button
                type="button"
                class="button-danger btn-excluir-pendencia"
            >
                Excluir
            </button>

        </div>


        <div class="form-grid">

            <div class="form-field">

                <label>
                    Descrição
                </label>

                <textarea
                    class="pendencia-descricao"
                    rows="3"
                ></textarea>

            </div>

            <div class="form-field">

                <label>
                    Providência
                </label>

                <textarea
                    class="pendencia-providencia"
                    rows="3"
                ></textarea>

            </div>


            <div class="form-field">

                <label>
                    Divisão CAP
                </label>

                <select
                    class="pendencia-divisao"
                >
                    <option value="" selected disabled>
                        Selecione a divisão
                    </option>

                    ${criarOpcoesDivisao("")}
                </select>

            </div>


            <div class="form-field">

                <label>
                    Situação
                </label>

                <select
                    class="pendencia-situacao"
                >
                    <option value="" selected disabled>
                        Selecione a situação
                    </option>

                    ${criarOpcoesSituacaoPendencia("")}
                </select>

            </div>

            <div class="form-field">

                <label>
                    Fase vinculada
                    <small class="field-help">
                        Preencha este campo apenas depois de salvar os trechos
                    </small>
                </label>

                <select
                    class="pendencia-fase-vinculada"
                >
                    ${criarOpcoesFasesVinculadas(null)}
                </select>

            </div>


            <div class="form-field">

                <label>
                    Data de entrada
                </label>

                <input
                    type="date"
                    class="pendencia-data-entrada"
                    value=""
                >

            </div>


            <div class="form-field">

                <label>
                    Prazo
                </label>

                <input
                    type="date"
                    class="pendencia-prazo"
                    value=""
                >

            </div>


            <div class="form-field">

                <label>
                    Data de saída
                </label>

                <input
                    type="date"
                    class="pendencia-data-saida"
                    value=""
                >

            </div>

        </div>


        <div class="pendencia-subsecao">

            <h4>
                Atribuído a
            </h4>

            <div class="atribuicoes-grid atribuicoes-checkboxes">

                ${criarCheckboxAtribuicoes([])}

            </div>

        </div>


        <div
            class="pendencia-subsecao regionais-container"
            hidden
        >

            <h4>
                Regionais
            </h4>

            <div class="regionais-multiselect">

                <button
                    type="button"
                    class="regionais-trigger"
                    aria-expanded="false"
                >

                    <span class="regionais-trigger-text">
                        Selecione as regionais
                    </span>

                    <span class="regionais-trigger-seta">
                        ▾
                    </span>

                </button>


                <div
                    class="regionais-dropdown"
                    hidden
                >

                    <div class="regionais-opcoes">
                    </div>

                </div>


                <select
                    class="pendencia-regionais"
                    multiple
                    hidden
                >
                    ${criarOpcoesRegionais([])}
                </select>

            </div>

        </div>


        <div class="pendencia-subsecao">

            <div class="edit-section-header">

                <h4>
                    Histórico da pendência
                </h4>

                <button
                    type="button"
                    class="button-primary btn-adicionar-historico"
                >
                    + Adicionar histórico
                </button>

            </div>


            <div class="lista-historicos-edicao">

                ${criarHistoricosHtml([])}

            </div>

        </div>

    `;


    container.appendChild(bloco);

    configurarSelectsCustomizados();
    configurarMultiselectRegionais();
    configurarInteracoesPendencias();

    bloco.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}

function configurarInteracoesPendencias() {

    document
        .querySelectorAll(".edit-pendencia-card")
        .forEach((pendenciaCard) => {

            if (
                pendenciaCard.dataset.interacoesConfiguradas === "true"
            ) {
                return;
            }

            pendenciaCard.dataset.interacoesConfiguradas = "true";


            const checkboxes =
                pendenciaCard.querySelectorAll(
                    ".atribuicao-checkbox"
                );

            const regionaisContainer =
                pendenciaCard.querySelector(
                    ".regionais-container"
                );


            function atualizarRegionais() {

                const regionalMarcada =
                    [...checkboxes].some(
                        (checkbox) =>
                            checkbox.value === "Regional" &&
                            checkbox.checked
                    );

                regionaisContainer.hidden =
                    !regionalMarcada;

            }


            checkboxes.forEach((checkbox) => {

                checkbox.addEventListener(
                    "change",
                    atualizarRegionais
                );

            });


            const btnHistorico =
                pendenciaCard.querySelector(
                    ".btn-adicionar-historico"
                );

            const listaHistoricos =
                pendenciaCard.querySelector(
                    ".lista-historicos-edicao"
                );


            btnHistorico.addEventListener(
                "click",
                () => {

                    const vazio =
                        listaHistoricos.querySelector(
                            ".historico-vazio"
                        );

                    if (vazio) {
                        vazio.remove();
                    }


                    listaHistoricos.insertAdjacentHTML(
                        "beforeend",
                        criarHistoricoHtml()
                    );

                }
            );

        });

}

function normalizarLista(valor) {

    if (Array.isArray(valor)) {
        return valor;
    }

    if (!valor) {
        return [];
    }

    return [valor];

}


function criarCheckboxAtribuicoes(valoresAtuais) {

    const selecionados =
        normalizarLista(valoresAtuais);

    const opcoes = [
        "DE",
        "DO",
        "CAP",
        "Regional"
    ];


    return opcoes
        .map((opcao) => `

            <label class="checkbox-option">

                <input
                    type="checkbox"
                    class="atribuicao-checkbox"
                    value="${opcao}"
                    ${
                        selecionados.includes(opcao)
                            ? "checked"
                            : ""
                    }
                >

                <span>${opcao}</span>

            </label>

        `)
        .join("");

}


function criarOpcoesRegionais(valoresAtuais) {

    const selecionadas =
        normalizarLista(valoresAtuais);

    const regionais = [
        "CGR1",
        "CGR2",
        "CGR3",
        "CGR4",
        "CGR5",
        "CGR6",
        "CGR7",
        "CGR8",
        "CGR9",
        "CGR10",
        "CGR11",
        "CGR12",
        "CGR13",
        "CGR14"
    ];


    return regionais
        .map((regional) => `

            <option
                value="${regional}"
                ${
                    selecionadas.includes(regional)
                        ? "selected"
                        : ""
                }
            >
                ${regional}
            </option>

        `)
        .join("");

}


function criarHistoricosHtml(historicos) {

    if (!historicos.length) {

        return `
            <p class="muted-text historico-vazio">
                Nenhum histórico cadastrado.
            </p>
        `;

    }


    return historicos
        .map((historico) =>
            criarHistoricoHtml(historico)
        )
        .join("");

}


function criarHistoricoHtml(historico = {}) {

    return `

        <div class="historico-edit-card">

            <input
                type="hidden"
                class="historico-id"
                value="${historico.id ?? 0}"
            >

            <div class="form-grid">

                <div class="form-field">

                    <label>
                        Data
                    </label>

                    <input
                        type="date"
                        class="historico-data"
                        value="${normalizarDataInput(
                            historico.data
                        )}"
                    >

                </div>


                <div class="form-field">

                    <label>
                        Histórico
                    </label>

                    <textarea
                        class="historico-texto"
                        rows="3"
                    >${escapeHtml(
                        historico.texto ?? ""
                    )}</textarea>

                </div>

            </div>

            <div class="historico-edit-acoes">

                <button
                    type="button"
                    class="button-danger btn-excluir-historico-pendencia"
                >
                    Excluir
                </button>

            </div>

        </div>

    `;

}

document.addEventListener(
    "click",
    (event) => {

        const btnExcluir =
            event.target.closest(
                ".btn-excluir-historico-pendencia"
            );

        if (!btnExcluir) {
            return;
        }


        const cardHistorico =
            btnExcluir.closest(
                ".historico-edit-card"
            );

        if (!cardHistorico) {
            return;
        }


        const confirmar =
            window.confirm(
                "Deseja realmente excluir este histórico?"
            );

        if (!confirmar) {
            return;
        }


        cardHistorico.remove();

    }
);

function criarOpcoesDivisao(valorAtual) {

    const divisoes = [
        "Supervisão obra",
        "Não Aplicável",
        "Meio Sócio",
        "Meio Físico",
        "Licenciamento",
        "INFRAÇÃO AMBIENTAL",
        "Flora",
        "Fauna",
        "Concessionária"
    ];


    return `

        ${
            divisoes
                .map((divisao) => `
                    <option
                        value="${divisao}"
                        ${
                            valorAtual === divisao
                                ? "selected"
                                : ""
                        }
                    >
                        ${divisao}
                    </option>
                `)
                .join("")
        }
    `;

}


function criarOpcoesSituacaoPendencia(valorAtual) {

    const situacoes = [
        "Aberta",
        "Atendida"
    ];


    return situacoes
        .map((situacao) => `
            <option
                value="${situacao}"
                ${
                    valorAtual === situacao
                        ? "selected"
                        : ""
                }
            >
                ${situacao}
            </option>
        `)
        .join("");

}

function criarOpcoesFasesVinculadas(valorAtual) {

    const opcoes = [];

    const trechos =
        processoAtual?.trechos ?? [];


    trechos.forEach(
        (trecho, trechoIndex) => {

            const fases =
                trecho.fases ?? [];


            fases.forEach(
                (fase) => {

                    if (
                        !fase.id ||
                        !fase.fase
                    ) {
                        return;
                    }


                    opcoes.push({
                        id: fase.id,

                        texto:
                            `Trecho ${trechoIndex + 1} - ${fase.fase}`
                    });

                }
            );

        }
    );


    return `
        <option value="">
            Selecione a fase
        </option>

        ${opcoes
            .map(
                (opcao) => `
                    <option
                        value="${opcao.id}"
                        ${
                            Number(valorAtual) ===
                            Number(opcao.id)
                                ? "selected"
                                : ""
                        }
                    >
                        ${escapeHtml(opcao.texto)}
                    </option>
                `
            )
            .join("")}
    `;

}


function configurarBotoes() {

    const form =
        document.getElementById(
            "formProcesso"
        );

    const btnAdicionarTecnico =
        document.getElementById(
            "btnAdicionarTecnico"
        );

    const btnAdicionarTrecho =
        document.getElementById(
            "btnAdicionarTrecho"
        );

    const btnAdicionarPendencia =
        document.getElementById(
            "btnAdicionarPendencia"
        );


    const btnCancelar =
        document.getElementById(
            "btnCancelar"
        );


    btnCancelar.addEventListener(
        "click",
        () => {

            window.location.href =
                `./processo.html?id=${processoAtual.id}`;

        }
    );

    if (
        btnAdicionarPendencia &&
        !btnAdicionarPendencia.dataset.configurado
    ) {

        btnAdicionarPendencia.dataset.configurado =
            "true";

        btnAdicionarPendencia.addEventListener(
            "click",
            adicionarNovaPendenciaEdicao
        );

    }

    btnAdicionarTecnico?.addEventListener(
        "click",
        () => {

            const container =
                document.getElementById(
                    "listaTecnicos"
                );

            const bloco =
                document.createElement("div");

            bloco.className =
                "tecnico-responsavel-item";

            bloco.innerHTML = `
                <input
                    type="text"
                    class="tecnico-responsavel"
                    placeholder="Digite o nome do técnico"
                >

                <button
                    type="button"
                    class="button-danger btn-remover-tecnico"
                >
                    Remover
                </button>
            `;

            bloco
                .querySelector(
                    ".btn-remover-tecnico"
                )
                .addEventListener(
                    "click",
                    () => {
                        bloco.remove();
                    }
                );

            container.appendChild(bloco);
        }
    );

    btnAdicionarTrecho?.addEventListener(
        "click",
        () => {

            const container =
                document.getElementById(
                    "listaTrechosEdicao"
                );

            const quantidadeAtual =
                container.querySelectorAll(
                    ".edit-trecho-card"
                ).length;


            const mensagemVazia =
                container.querySelector(
                    ".muted-text"
                );

            if (mensagemVazia) {
                mensagemVazia.remove();
            }


            const novoTrecho = {

                id: 0,

                rodId: 0,

                rodovia: {
                    rodId: 0,
                    rodCodigo: ""
                },

                kmInicial: null,

                kmFinal: null,

                fases: [
                    {
                        id: 0,
                        ordem: 1,
                        fase: "CP",
                        numeroProcesso: "",
                        numeroLicenciamento: "",
                        statusFase: "Em andamento",
                        numeroFase: "",
                        dataEmissaoFase: null,
                        dataValidadeFase: null
                    }
                ],

                fasesComplementares: []

            };


            renderizarTrechosEdicao(
                [novoTrecho],
                false,
                quantidadeAtual
            );

        }
    );


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!processoAtual) {
                alert("Processo não carregado.");
                return;
            }

            const tecnicosResponsaveis =
                Array.from(
                    document.querySelectorAll(
                        ".tecnico-responsavel"
                    )
                )
                .map(input => input.value.trim())
                .filter(nome => nome !== "");

            const tecnicoResponsavel =
                tecnicosResponsaveis.join("; ");

            const numeroOuNull = (valor) => {

                if (
                    valor === undefined ||
                    valor === null ||
                    String(valor).trim() === ""
                ) {
                    return null;
                }

                const numero =
                    Number(valor);

                return Number.isNaN(numero)
                    ? null
                    : numero;
            };


            const valorElemento = (
                raiz,
                seletor
            ) => {

                const elemento =
                    raiz.querySelector(seletor);

                return elemento?.value?.trim() ?? "";
            };


            const dataOuNull = (
                raiz,
                seletor
            ) => {

                const valor =
                    valorElemento(
                        raiz,
                        seletor
                    );

                return valor || null;
            };

            const cardsTrechos =
                Array.from(
                    document.querySelectorAll(
                        ".edit-trecho-card"
                    )
                );

            for (
                let i = 0;
                i < cardsTrechos.length;
                i++
            ) {

                const card =
                    cardsTrechos[i];

                const inputRodId =
                    card.querySelector(
                        ".trecho-rod-id"
                    );

                const inputRodovia =
                    card.querySelector(
                        ".trecho-rodovia"
                    );

                const rodId =
                    Number(
                        inputRodId?.value ?? 0
                    );


                if (
                    !inputRodovia?.value.trim() ||
                    !rodId
                ) {

                    alert(
                        `Selecione uma rodovia válida no Trecho ${i + 1}.`
                    );

                    inputRodovia?.focus();

                    card.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    return;
                }

            }

            const TAMANHO_MAXIMO_PDF =
                20 * 1024 * 1024; // 20 MB


            const inputsAnexos =
                Array.from(
                    document.querySelectorAll(
                        ".fase-complementar-anexo"
                    )
                );


            for (const input of inputsAnexos) {

                const arquivo =
                    input.files?.[0];


                if (!arquivo) {
                    continue;
                }

                if (
                    arquivo.size >
                    TAMANHO_MAXIMO_PDF
                ) {

                    const tamanhoMb =
                        (
                            arquivo.size /
                            1024 /
                            1024
                        ).toFixed(1);


                    alert(
                        `O arquivo "${arquivo.name}" possui ${tamanhoMb} MB.\n\n` +
                        "O tamanho máximo permitido é 20 MB."
                    );


                    input.value = "";


                    input.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });


                    return;
                }

                const extensaoPdf =
                    arquivo.name
                        .toLowerCase()
                        .endsWith(".pdf");


                const tipoPdf =
                    arquivo.type ===
                    "application/pdf";


                if (
                    !extensaoPdf ||
                    !tipoPdf
                ) {

                    alert(
                        `O arquivo "${arquivo.name}" não é um PDF válido.\n\n` +
                        "Selecione um arquivo no formato PDF."
                    );


                    input.value = "";


                    input.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });


                    return;
                }

            }

            const arquivosFasesComplementares = [];

            const trechos =
                cardsTrechos.map(
                    (card, trechoIndex) => {

                        const trechoOriginal =
                            processoAtual.trechos?.[
                                trechoIndex
                            ] ?? {};


                        const cardsFases =
                            Array.from(
                                card.querySelectorAll(
                                    ".edit-fase-card"
                                )
                            );


                        const fases =
                            cardsFases.map(
                                (
                                    faseCard,
                                    faseIndex
                                ) => {

                                    const faseOriginal =
                                        trechoOriginal
                                            .fases?.[
                                                faseIndex
                                            ] ?? {};


                                    const faseId =
                                        Number(
                                            faseCard
                                                .querySelector(
                                                    ".fase-id"
                                                )
                                                ?.value ??
                                            faseOriginal.id ??
                                            0
                                        );


                                    const fase =
                                        valorElemento(
                                            faseCard,
                                            ".fase-fase, .fase-tipo"
                                        ) ||
                                        faseOriginal.fase ||
                                        "";


                                    const numeroProcesso =
                                        valorElemento(
                                            faseCard,
                                            ".fase-numero-processo"
                                        ) ||
                                        faseOriginal.numeroProcesso ||
                                        "";

                                    const numeroLicenciamento =
                                        valorElemento(
                                            faseCard,
                                            ".fase-numero-licenciamento"
                                        ) ||
                                        faseOriginal.numeroLicenciamento ||
                                        "";


                                    const statusFase =
                                        valorElemento(
                                            faseCard,
                                            ".fase-status, .fase-status-fase, .fase-situacao"
                                        ) ||
                                        faseOriginal.statusFase ||
                                        "";


                                    const numeroFase =
                                        valorElemento(
                                            faseCard,
                                            ".fase-numero"
                                        ) ||
                                        faseOriginal.numeroFase ||
                                        "";


                                    const dataEmissaoFase =
                                        dataOuNull(
                                            faseCard,
                                            ".fase-data-emissao"
                                        ) ??
                                        faseOriginal.dataEmissaoFase ??
                                        null;


                                    const dataValidadeFase =
                                        dataOuNull(
                                            faseCard,
                                            ".fase-data-validade"
                                        ) ??
                                        faseOriginal.dataValidadeFase ??
                                        null;


                                    return {
                                        id: faseId,
                                        ordem:
                                            faseIndex + 1,
                                        fase:
                                            fase,
                                        numeroProcesso:
                                            numeroProcesso,
                                        numeroLicenciamento:
                                            numeroLicenciamento,
                                        statusFase:
                                            statusFase,
                                        numeroFase:
                                            numeroFase,
                                        dataEmissaoFase:
                                            dataEmissaoFase,
                                        dataValidadeFase:
                                            dataValidadeFase
                                    };
                                }
                            );

                        const complementaresDoTrecho =
                            Array.from(
                                card.querySelectorAll(
                                    ".fase-complementar-item"
                                )
                            )
                            .map((item) => {

                                const id =
                                    Number(
                                        item
                                            .querySelector(
                                                ".fase-complementar-id"
                                            )
                                            ?.value ?? 0
                                    );

                                const fase =
                                    item
                                        .querySelector(
                                            ".fase-complementar-tipo"
                                        )
                                        ?.value
                                        ?.trim() ?? "";

                                const dataEmissao =
                                    item
                                        .querySelector(
                                            ".fase-complementar-data"
                                        )
                                        ?.value || null;

                                const arquivo =
                                    item
                                        .querySelector(
                                            ".fase-complementar-anexo"
                                        )
                                        ?.files?.[0] ?? null;

                                return {
                                    id,
                                    fase,
                                    dataEmissao,
                                    arquivo
                                };
                            })
                            .filter(
                                item =>
                                    item.fase !== ""
                            );


                        arquivosFasesComplementares[
                            trechoIndex
                        ] =
                            complementaresDoTrecho.map(
                                item => item.arquivo
                            );


                        const fasesComplementares =
                            complementaresDoTrecho.map(
                                item => ({
                                    id: item.id,
                                    fase: item.fase,
                                    dataEmissao: item.dataEmissao
                                })
                            );


                        const rodId =
                            Number(
                                card
                                    .querySelector(
                                        ".trecho-rod-id"
                                    )
                                    ?.value ??
                                trechoOriginal.rodId ??
                                trechoOriginal
                                    .rodovia
                                    ?.rodId ??
                                0
                            );


                        const kmInicial =
                            numeroOuNull(
                                card
                                    .querySelector(
                                        ".trecho-km-inicial"
                                    )
                                    ?.value
                            );


                        const kmFinal =
                            numeroOuNull(
                                card
                                    .querySelector(
                                        ".trecho-km-final"
                                    )
                                    ?.value
                            );


                        return {

                            id:
                                Number(
                                    card
                                        .querySelector(
                                            ".trecho-id"
                                        )
                                        ?.value ??
                                    trechoOriginal.id ??
                                    0
                                ),

                            rodId:
                                rodId,

                            kmInicial:
                                kmInicial,

                            kmFinal:
                                kmFinal,

                            fases:
                                fases,
                            
                            fasesComplementares:
                                fasesComplementares
                        };
                    }
                );

            const cardsPendencias =
                Array.from(
                    document.querySelectorAll(
                        ".edit-pendencia-card"
                    )
                );


            const pendencias =
                cardsPendencias.map(
                    (
                        card,
                        pendenciaIndex
                    ) => {

                        const pendenciaOriginal =
                            processoAtual
                                .pendencias?.[
                                    pendenciaIndex
                                ] ?? {};

                        const atribuicoes =
                            Array.from(
                                card.querySelectorAll(
                                    ".atribuicao-checkbox:checked"
                                )
                            )
                            .map(
                                checkbox =>
                                    checkbox.value
                            );


                        const selectRegionais =
                            card.querySelector(
                                ".pendencia-regionais"
                            );


                        const regionais =
                            selectRegionais
                                ? Array.from(
                                    selectRegionais
                                        .selectedOptions
                                ).map(
                                    option =>
                                        option.value
                                )
                                : [];


                        const cardsHistoricos =
                            Array.from(
                                card.querySelectorAll(
                                    ".historico-edit-card"
                                )
                            );


                        const historicos =
                            cardsHistoricos.length > 0

                                ? cardsHistoricos.map(
                                    (
                                        historicoCard,
                                        historicoIndex
                                    ) => {

                                        const historicoOriginal =
                                            pendenciaOriginal
                                                .historicos?.[
                                                    historicoIndex
                                                ] ?? {};


                                        return {

                                            id:
                                                Number(
                                                    historicoCard
                                                        .querySelector(
                                                            ".historico-id"
                                                        )
                                                        ?.value ??
                                                    historicoOriginal.id ??
                                                    0
                                                ),

                                            data:
                                                dataOuNull(
                                                    historicoCard,
                                                    ".historico-data"
                                                ),

                                            texto:
                                                valorElemento(
                                                    historicoCard,
                                                    ".historico-texto"
                                                )
                                        };
                                    }
                                )

                                : (
                                    pendenciaOriginal
                                        .historicos ??
                                    []
                                );

                        return {

                            id:
                                Number(
                                    card
                                        .querySelector(
                                            ".pendencia-id"
                                        )
                                        ?.value ??
                                    pendenciaOriginal.id ??
                                    0
                                ),

                            descricao:
                                valorElemento(
                                    card,
                                    ".pendencia-descricao"
                                ),

                            providencia:
                                valorElemento(
                                    card,
                                    ".pendencia-providencia"
                                ),

                            divisaoCap:
                                valorElemento(
                                    card,
                                    ".pendencia-divisao"
                                ) || null,

                            situacao:
                                valorElemento(
                                    card,
                                    ".pendencia-situacao"
                                ),

                            faseTrechoId:
                                Number(
                                    valorElemento(
                                        card,
                                        ".pendencia-fase-vinculada"
                                    )
                                ) || null,

                            dataEntrada:
                                dataOuNull(
                                    card,
                                    ".pendencia-data-entrada"
                                ),

                            prazo:
                                dataOuNull(
                                    card,
                                    ".pendencia-prazo"
                                ),

                            dataSaida:
                                dataOuNull(
                                    card,
                                    ".pendencia-data-saida"
                                ),

                            atribuidoA:
                                atribuicoes,

                            regionais:
                                regionais,

                            faseVinculadaRef:
                                card
                                    .querySelector(
                                        ".pendencia-fase-vinculada"
                                    )
                                    ?.value ??
                                pendenciaOriginal
                                    .faseVinculadaRef ??
                                null,

                            historicos:
                                historicos
                        };
                    }
                );


            const primeiraFase =
                trechos
                    .flatMap(
                        trecho =>
                            trecho.fases ?? []
                    )[0];


            const payload = {

                ...processoAtual,


                empreendimento:
                    document
                        .getElementById(
                            "empreendimento"
                        )
                        ?.value
                        ?.trim() ??
                    processoAtual.empreendimento,


                interessado:
                    document
                        .getElementById(
                            "interessado"
                        )
                        ?.value
                        ?.trim() ??
                    "",


                tecnicoResponsavel:
                    tecnicoResponsavel,


                identificacaoEmpreendimento:
                    document
                        .getElementById(
                            "identificacaoEmpreendimento"
                        )
                        ?.value
                        ?.trim() ??
                    "",


                caracterizacaoEmpreendimento:
                    document
                        .getElementById(
                            "caracterizacaoEmpreendimento"
                        )
                        ?.value
                        ?.trim() ??
                    "",


                historicoProcessoData:
                    document
                        .getElementById(
                            "historicoProcessoData"
                        )
                        ?.value ||
                    null,


                historicoProcessoTexto:
                    document
                        .getElementById(
                            "historicoProcessoTexto"
                        )
                        ?.value
                        ?.trim() ??
                    "",


                trechos:
                    trechos,


                pendencias:
                    pendencias,


                fase:
                    primeiraFase?.fase ||
                    processoAtual.fase ||
                    "",


                statusFase:
                    primeiraFase?.statusFase ||
                    processoAtual.statusFase ||
                    "",


                numeroFase:
                    primeiraFase?.numeroFase ||
                    processoAtual.numeroFase ||
                    "",


                dataEmissaoFase:
                    primeiraFase?.dataEmissaoFase ??
                    processoAtual.dataEmissaoFase ??
                    null,


                dataValidadeFase:
                    primeiraFase?.dataValidadeFase ??
                    processoAtual.dataValidadeFase ??
                    null
            };

            console.log(
                "PENDENCIAS QUE SERIAM ENVIADAS:",
                payload.pendencias
            );


            try {

                const response =
                    await fetch(
                        `${API_URL}/processos/${processoAtual.id}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                if (!response.ok) {

                    const mensagem =
                        await response.text();


                    throw new Error(
                        mensagem ||
                        `Erro HTTP ${response.status}`
                    );
                }

                const resultadoPut =
                    await response.json();

                for (
                    const [trechoIndex, trechoResultado]
                    of (resultadoPut.trechos ?? []).entries()
                ) {

                    const arquivosFasesDoTrecho =
                        arquivosFasesTrecho[
                            trechoIndex
                        ] ?? [];


                    for (
                        const [faseIndex, faseResultado]
                        of (
                            trechoResultado.fases ?? []
                        ).entries()
                    ) {

                        const arquivo =
                            arquivosFasesDoTrecho[
                                faseIndex
                            ];


                        if (!arquivo) {
                            continue;
                        }

                        const formData =
                            new FormData();


                        formData.append(
                            "arquivo",
                            arquivo
                        );


                        const uploadResponse =
                            await fetch(
                                `${API_URL}/processos/fases/${faseResultado.id}/anexo`,
                                {
                                    method: "POST",
                                    body: formData
                                }
                            );


                        if (!uploadResponse.ok) {

                            const mensagemUpload =
                                await uploadResponse.text();


                            throw new Error(
                                mensagemUpload ||
                                "Erro ao enviar anexo da fase emitida."
                            );

                        }

                    }

                }


                for (
                    const trechoResultado
                    of resultadoPut.trechos ?? []
                ) {

                    const arquivosDoTrecho =
                        arquivosFasesComplementares[
                            trechoResultado.indice
                        ] ?? [];


                    for (
                        const complementarResultado
                        of trechoResultado
                            .fasesComplementares ?? []
                    ) {

                        const arquivo =
                            arquivosDoTrecho[
                                complementarResultado.indice
                            ];


                        if (!arquivo) {
                            continue;
                        }


                        const formData =
                            new FormData();

                        formData.append(
                            "arquivo",
                            arquivo
                        );


                        const uploadResponse =
                            await fetch(
                                `${API_URL}/processos/fases-complementares/${complementarResultado.id}/anexo`,
                                {
                                    method: "POST",
                                    body: formData
                                }
                            );


                        if (!uploadResponse.ok) {

                            const mensagemUpload =
                                await uploadResponse.text();

                            throw new Error(
                                mensagemUpload ||
                                "Erro ao enviar anexo da fase complementar."
                            );
                        }
                    }
                }


                alert(
                    "Processo atualizado com sucesso."
                );


                window.location.href =
                    `./processo.html?id=${processoAtual.id}`;

            }
            catch (error) {

                console.error(
                    "Erro ao atualizar processo:",
                    error
                );


                alert(
                    "Não foi possível salvar as alterações. " +
                    "Veja o console para mais detalhes."
                );
            }

        }
    );

}

document.addEventListener(
    "click",
    (event) => {

        const btnExcluir =
            event.target.closest(
                ".btn-excluir-trecho"
            );

        if (btnExcluir) {

            const card =
                btnExcluir.closest(
                    ".edit-trecho-card"
                );

            if (!card) {
                return;
            }

            const confirmar =
                window.confirm(
                    "Deseja realmente excluir este trecho?"
                );

            if (!confirmar) {
                return;
            }

            card.remove();

            atualizarTrechosCadastroPelaTela();

            renderizarTrechosEdicao(
                trechosCadastro
            );
        }

    }
);


function mostrarErro() {

    document
        .getElementById("carregando")
        .hidden = true;


    document
        .getElementById("erroProcesso")
        .hidden = false;

}