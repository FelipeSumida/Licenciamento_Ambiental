const API_URL = "http://localhost:5161/api";

let processoAtual = null;
let trechosCadastro = [];
let pendenciasCadastro = [];
let arquivosFasesComplementares = [];
let arquivosFasesTrecho = [];


document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("carregando")
        .hidden = true;

    document
        .getElementById("formProcesso")
        .hidden = false;

    configurarBotoes();
    configurarSelectsCustomizados();
});


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
        configurarSelectsCustomizados();

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


    document
        .getElementById(
            "tecnicoResponsavel"
        )
        .value =
        processo.tecnicoResponsavel ?? "";

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

function criarFaseComplementarHtml(
    fase = {},
    arquivoPreservado = null
) {

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

                    <label>Anexo</label>

                    <input
                        type="file"
                        class="fase-complementar-anexo"
                        accept="application/pdf"
                    >

                    ${
                        arquivoPreservado
                            ? `
                                <div class="arquivo-preservado">
                                    Arquivo selecionado:
                                    <strong>
                                        ${escapeHtml(
                                            arquivoPreservado.name
                                        )}
                                    </strong>
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

function criarFaseAtualHtml(fase, faseIndex) {

    const emitido =
        fase.statusFase === "Emitido";

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
                        N° do licenciamento
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

                <div class="form-grid form-grid-4">

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

                    <div class="form-field">

                        <label>
                            Anexo
                        </label>

                        <input
                            type="file"
                            class="fase-anexo"
                            accept=".pdf,application/pdf"
                        >

                    </div>

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
        fase.anexoNome ||
        "";

    return `
        <div
            class="edit-fase-card fase-passada-card"
            data-fase-atual="false"
        >

            <!--
                Mantemos estes campos escondidos
                para o código de salvar continuar
                encontrando os mesmos valores.
            -->

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
                class="fase-anexo-nome"
                value="${escapeHtml(nomeAnexo)}"
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


                <div class="form-grid form-grid-4">

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


                    <div class="form-field">

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

            if (!card) {
                return;
            }

            const visualizacao =
                card.querySelector(
                    ".fase-passada-visualizacao"
                );

            const edicao =
                card.querySelector(
                    ".fase-passada-edicao"
                );

            if (
                !visualizacao ||
                !edicao
            ) {
                return;
            }

            visualizacao.hidden = true;
            edicao.hidden = false;

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

            if (!card) {
                return;
            }

            const visualizacao =
                card.querySelector(
                    ".fase-passada-visualizacao"
                );

            const edicao =
                card.querySelector(
                    ".fase-passada-edicao"
                );

            if (
                !visualizacao ||
                !edicao
            ) {
                return;
            }

            edicao.hidden = true;
            visualizacao.hidden = false;

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

                anexoNome:
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

            const numeroPassada =
                passadas.indexOf(card) + 1;

            const wrapper =
                document.createElement("div");

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

            if (!card) {
                return;
            }

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

            const passadas =
                Array.from(
                    lista.querySelectorAll(
                        ".fase-passada-card"
                    )
                );

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
                trechoIndex >= 0 &&
                faseIndex >= 0 &&
                arquivosFasesTrecho[
                    trechoIndex
                ]
            ) {

                arquivosFasesTrecho[
                    trechoIndex
                ].splice(
                    faseIndex,
                    1
                );
            }

            card.remove();

            if (lista) {
                reordenarFasesDaLista(
                    lista
                );
            }

            return;
        }

    }
);

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

    const arquivoSelecionado =
        cardAtual
            .querySelector(".fase-anexo")
            ?.files?.[0] ?? null;

    fase.anexoNome =
        arquivoSelecionado?.name || "";


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


    if (!fase.numeroFase) {

        alert(
            "Preencha o número da fase antes de finalizar."
        );

        return;
    }


    if (!fase.dataEmissaoFase) {

        alert(
            "Preencha a data de emissão antes de finalizar."
        );

        return;
    }

    atualizarTrechosCadastroPelaTela();


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

function renderizarTrechosEdicao(trechos) {

    const container =
        document.getElementById(
            "listaTrechosEdicao"
        );

    container.innerHTML = "";


    if (trechos.length === 0) {

        container.innerHTML = `
            <p class="muted-text">
                Nenhum trecho cadastrado.
            </p>
        `;

        return;
    }


    trechos.forEach(
        (trecho, trechoIndex) => {

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

            blocoTrecho.innerHTML = `

                <div class="edit-section-header">
                    <h3>
                        Trecho ${trechoIndex + 1}
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
                (faseComplementar, complementarIndex) => {

                    const arquivoPreservado =
                        arquivosFasesComplementares[
                            trechoIndex
                        ]?.[
                            complementarIndex
                        ] ?? null;


                    listaComplementares.insertAdjacentHTML(
                        "beforeend",
                        criarFaseComplementarHtml(
                            faseComplementar,
                            arquivoPreservado
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
    configurarSelectsCustomizados();

    document
        .querySelectorAll(
            '.edit-fase-card[data-fase-atual="true"]'
        )
        .forEach(
            card => configurarFaseAtual(card)
        );

}

document.addEventListener(
    "click",
    (event) => {

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

    }
);

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


function escapeHtml(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

function criarOpcoesFasesVinculadasCadastro(valorAtual) {

    const opcoes = [];

    trechosCadastro.forEach(
        (trecho, trechoIndex) => {

            const fases =
                Array.isArray(trecho.fases)
                    ? trecho.fases
                    : [];


            fases.forEach(
                (fase, faseIndex) => {

                    if (!fase.fase) {
                        return;
                    }


                    const referencia =
                        `${trechoIndex}:${faseIndex}`;


                    opcoes.push({
                        valor: referencia,

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
                        value="${opcao.valor}"
                        ${
                            String(valorAtual ?? "") ===
                            String(opcao.valor)
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
                        </label>

                        <select
                            class="pendencia-fase-vinculada"
                        >
                            ${criarOpcoesFasesVinculadasCadastro(
                                pendencia.faseVinculadaRef
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

                    <div class="atribuicoes-grid">

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
                                ⌄
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

    configurarInteracoesPendencias();
    configurarMultiselectRegionais();
    configurarSelectsCustomizados();

}

function configurarInteracoesPendencias() {

    document
        .querySelectorAll(".edit-pendencia-card")
        .forEach((pendenciaCard) => {

            const btnExcluirPendencia =
                pendenciaCard.querySelector(
                    ".btn-excluir-pendencia"
                );

            const pendenciaIndex =
                Array.from(
                    document.querySelectorAll(
                        ".edit-pendencia-card"
                    )
                ).indexOf(pendenciaCard);


            btnExcluirPendencia?.addEventListener(
                "click",
                () => {

                    atualizarPendenciasCadastroPelaTela();

                    pendenciasCadastro.splice(
                        pendenciaIndex,
                        1
                    );

                    renderizarPendenciasEdicao(
                        pendenciasCadastro
                    );

                }
            );

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

            listaHistoricos.addEventListener(
                "click",
                (event) => {

                    const btnExcluir =
                        event.target.closest(
                            ".btn-excluir-historico"
                        );

                    if (!btnExcluir) {
                        return;
                    }

                    const historicoCard =
                        btnExcluir.closest(
                            ".historico-edit-card"
                        );

                    historicoCard?.remove();


                    if (
                        listaHistoricos.querySelectorAll(
                            ".historico-edit-card"
                        ).length === 0
                    ) {

                        listaHistoricos.innerHTML = `
                            <p class="muted-text historico-vazio">
                                Nenhum histórico cadastrado.
                            </p>
                        `;

                    }

                }
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

            <button
                type="button"
                class="button-danger btn-excluir-historico"
            >
                Excluir
            </button>

        </div>

    `;

}

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
        <option value="">
            Selecione...
        </option>

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

function atualizarPendenciasCadastroPelaTela() {

    const cards =
        document.querySelectorAll(
            ".edit-pendencia-card"
        );

    pendenciasCadastro =
        Array.from(cards).map(
            (card, index) => {

                const atribuicoes =
                    Array.from(
                        card.querySelectorAll(
                            ".atribuicao-checkbox:checked"
                        )
                    ).map(
                        checkbox => checkbox.value
                    );

                const selectRegionais =
                    card.querySelector(
                        ".pendencia-regionais"
                    );

                const regionais =
                    selectRegionais
                        ? Array.from(
                            selectRegionais.selectedOptions
                        ).map(
                            option => option.value
                        )
                        : [];

                const historicos =
                    Array.from(
                        card.querySelectorAll(
                            ".historico-edit-card"
                        )
                    ).map(
                        historicoCard => ({
                            id: Number(
                                historicoCard
                                    .querySelector(".historico-id")
                                    ?.value ?? 0
                            ),

                            data:
                                historicoCard
                                    .querySelector(".historico-data")
                                    ?.value || null,

                            texto:
                                historicoCard
                                    .querySelector(".historico-texto")
                                    ?.value?.trim() || ""
                        })
                    );

                return {
                    id: Number(
                        card
                            .querySelector(".pendencia-id")
                            ?.value ?? 0
                    ),

                    descricao:
                        card
                            .querySelector(".pendencia-descricao")
                            ?.value?.trim() || "",

                    providencia:
                        card
                            .querySelector(".pendencia-providencia")
                            ?.value?.trim() || "",

                    divisaoCap:
                        card
                            .querySelector(".pendencia-divisao")
                            ?.value || "",

                    situacao:
                        card
                            .querySelector(".pendencia-situacao")
                            ?.value || "Aberta",

                    dataEntrada:
                        card
                            .querySelector(".pendencia-data-entrada")
                            ?.value || null,

                    prazo:
                        card
                            .querySelector(".pendencia-prazo")
                            ?.value || null,

                    dataSaida:
                        card
                            .querySelector(".pendencia-data-saida")
                            ?.value || null,

                    atribuidoA:
                        atribuicoes,

                    regionais:
                        regionais,

                    faseVinculadaRef:
                        card
                            .querySelector(".pendencia-fase-vinculada")
                            ?.value || null,

                    historicos:
                        historicos
                };
            }
        );
}

function atualizarTrechosCadastroPelaTela() {

    const cards =
        document.querySelectorAll(
            ".edit-trecho-card"
        );

    trechosCadastro =
        Array.from(cards).map(
            (card, trechoIndex) => {

                const rodId =
                    Number(
                        card
                            .querySelector(".trecho-rod-id")
                            ?.value ?? 0
                    );

                const rodCodigo =
                    card
                        .querySelector(".trecho-rodovia")
                        ?.value?.trim() || "";

                const kmInicialValor =
                    card
                        .querySelector(".trecho-km-inicial")
                        ?.value ?? "";

                const kmFinalValor =
                    card
                        .querySelector(".trecho-km-final")
                        ?.value ?? "";

                const arquivosFasesAnteriores =
                    arquivosFasesTrecho[
                        trechoIndex
                    ] ?? [];

                const novosArquivosFases = [];

                const fases =
                    Array.from(
                        card.querySelectorAll(
                            ".edit-fase-card"
                        )
                    ).map(
                        (faseCard, faseIndex) => {

                            const fase =
                                lerFaseDoCard(
                                    faseCard
                                );

                            const arquivoSelecionado =
                                faseCard
                                    .querySelector(
                                        ".fase-anexo"
                                    )
                                    ?.files?.[0] ?? null;

                            novosArquivosFases[
                                faseIndex
                            ] =
                                fase.statusFase === "Emitido"
                                    ? (
                                        arquivoSelecionado ||
                                        arquivosFasesAnteriores[
                                            faseIndex
                                        ] ||
                                        null
                                    )
                                    : null;

                            return fase;
                        }
                    );

                arquivosFasesTrecho[
                    trechoIndex
                ] = novosArquivosFases;

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


                const arquivosAnteriores =
                    arquivosFasesComplementares[
                        trechoIndex
                    ] ?? [];


                arquivosFasesComplementares[
                    trechoIndex
                ] =
                    complementaresDoTrecho.map(
                        (item, complementarIndex) =>
                            item.arquivo ??
                            arquivosAnteriores[
                                complementarIndex
                            ] ??
                            null
                    );


                const fasesComplementares =
                    complementaresDoTrecho.map(
                        item => ({
                            id: item.id,
                            fase: item.fase,
                            dataEmissao: item.dataEmissao
                        })
                    );

                return {
                    id: Number(
                        card
                            .querySelector(".trecho-id")
                            ?.value ?? 0
                    ),

                    rodId: rodId,

                    rodovia: {
                        rodId: rodId,
                        rodCodigo: rodCodigo
                    },

                    kmInicial:
                        kmInicialValor === ""
                            ? null
                            : Number(kmInicialValor),

                    kmFinal:
                        kmFinalValor === ""
                            ? null
                            : Number(kmFinalValor),

                    fases: fases,

                    fasesComplementares: fasesComplementares
                };
            }
        );
}

function obterTecnicosResponsaveis() {

    return Array.from(
        document.querySelectorAll(
            "#tecnicoResponsavel, .tecnico-responsavel"
        )
    )
        .map(
            input =>
                input.value.trim()
        )
        .filter(
            nome =>
                nome !== ""
        )
        .join("; ");
}

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

function validarFormularioNovoProcesso() {

    function erro(mensagem, elemento) {

        alert(mensagem);

        elemento?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        elemento?.focus();

        return false;
    }


    const empreendimento =
        document.getElementById("empreendimento");

    const identificacao =
        document.getElementById(
            "identificacaoEmpreendimento"
        );

    const caracterizacao =
        document.getElementById(
            "caracterizacaoEmpreendimento"
        );

    const interessado =
        document.getElementById("interessado");


    if (!empreendimento?.value?.trim()) {

        return erro(
            "Selecione o Tipo do empreendimento.",
            empreendimento
        );
    }


    if (!identificacao?.value?.trim()) {

        return erro(
            "Preencha a Identificação do Empreendimento.",
            identificacao
        );
    }


    if (!caracterizacao?.value?.trim()) {

        return erro(
            "Preencha a Caracterização do Empreendimento.",
            caracterizacao
        );
    }


    if (!interessado?.value?.trim()) {

        return erro(
            "Preencha o Interessado.",
            interessado
        );
    }


    const tecnicos =
        Array.from(
            document.querySelectorAll(
                ".tecnico-responsavel"
            )
        )
        .map(input => input.value.trim())
        .filter(Boolean);


    if (tecnicos.length === 0) {

        const primeiroTecnico =
            document.querySelector(
                ".tecnico-responsavel"
            );

        return erro(
            "Adicione pelo menos um Técnico Responsável.",
            primeiroTecnico
        );
    }


    const cardsTrechos =
        Array.from(
            document.querySelectorAll(
                ".edit-trecho-card"
            )
        );


    if (cardsTrechos.length === 0) {

        alert(
            "Adicione pelo menos um trecho ao processo."
        );

        return false;
    }


    for (
        let trechoIndex = 0;
        trechoIndex < cardsTrechos.length;
        trechoIndex++
    ) {

        const card =
            cardsTrechos[trechoIndex];


        const rodoviaInput =
            card.querySelector(
                ".trecho-rodovia"
            );

        const rodIdInput =
            card.querySelector(
                ".trecho-rod-id"
            );

        const kmInicialInput =
            card.querySelector(
                ".trecho-km-inicial"
            );

        const kmFinalInput =
            card.querySelector(
                ".trecho-km-final"
            );


        const rodovia =
            rodoviaInput?.value?.trim() ?? "";

        const rodId =
            Number(
                rodIdInput?.value ?? 0
            );

        const kmInicialTexto =
            kmInicialInput?.value?.trim() ?? "";

        const kmFinalTexto =
            kmFinalInput?.value?.trim() ?? "";


        if (!rodovia || !rodId) {

            return erro(
                `Trecho ${trechoIndex + 1}: ` +
                "selecione uma rodovia.",
                rodoviaInput
            );
        }


        if (kmInicialTexto === "") {

            return erro(
                `Trecho ${trechoIndex + 1}: ` +
                "o KM Inicial é obrigatório.",
                kmInicialInput
            );
        }


        if (kmFinalTexto === "") {

            return erro(
                `Trecho ${trechoIndex + 1}: ` +
                "o KM Final é obrigatório.",
                kmFinalInput
            );
        }


        const kmInicial =
            Number(kmInicialTexto);

        const kmFinal =
            Number(kmFinalTexto);


        if (
            !Number.isFinite(kmInicial)
        ) {

            return erro(
                `Trecho ${trechoIndex + 1}: ` +
                "o KM Inicial é inválido.",
                kmInicialInput
            );
        }


        if (
            !Number.isFinite(kmFinal)
        ) {

            return erro(
                `Trecho ${trechoIndex + 1}: ` +
                "o KM Final é inválido.",
                kmFinalInput
            );
        }


        if (kmInicial > kmFinal) {

            return erro(
                `Trecho ${trechoIndex + 1}: ` +
                "o KM Inicial não pode ser maior que o KM Final.",
                kmInicialInput
            );
        }


        const limiteInicial =
            Number(
                rodoviaInput?.dataset
                    ?.kmInicial
            );

        const limiteFinal =
            Number(
                rodoviaInput?.dataset
                    ?.kmFinal
            );


        if (
            Number.isFinite(limiteInicial) &&
            Number.isFinite(limiteFinal)
        ) {

            if (
                kmInicial < limiteInicial ||
                kmInicial > limiteFinal ||
                kmFinal < limiteInicial ||
                kmFinal > limiteFinal
            ) {

                return erro(
                    `Trecho ${trechoIndex + 1}: ` +
                    `o intervalo permitido desta rodovia é ` +
                    `de KM ${limiteInicial} até KM ${limiteFinal}.`,
                    kmInicialInput
                );
            }
        }


        const cardsFases =
            Array.from(
                card.querySelectorAll(
                    ".edit-fase-card"
                )
            );


        if (cardsFases.length === 0) {

            alert(
                `Trecho ${trechoIndex + 1}: ` +
                "adicione pelo menos uma fase."
            );

            return false;
        }


        for (
            let faseIndex = 0;
            faseIndex < cardsFases.length;
            faseIndex++
        ) {

            const faseCard =
                cardsFases[faseIndex];


            const faseInput =
                faseCard.querySelector(
                    ".fase-tipo, .fase-fase"
                );

            const numeroProcessoInput =
                faseCard.querySelector(
                    ".fase-numero-processo"
                );

            const numeroLicenciamentoInput =
                faseCard.querySelector(
                    ".fase-numero-licenciamento"
                );

            const situacaoInput =
                faseCard.querySelector(
                    ".fase-status, " +
                    ".fase-status-fase, " +
                    ".fase-situacao"
                );


            const fase =
                faseInput?.value?.trim() ?? "";

            const numeroProcesso =
                numeroProcessoInput
                    ?.value
                    ?.trim() ?? "";

            const numeroLicenciamento =
                numeroLicenciamentoInput
                    ?.value
                    ?.trim() ?? "";

            const situacao =
                situacaoInput
                    ?.value
                    ?.trim() ?? "";


            if (!fase) {

                return erro(
                    `Trecho ${trechoIndex + 1}, ` +
                    `Fase ${faseIndex + 1}: ` +
                    "selecione a fase.",
                    faseInput
                );
            }


            if (!numeroProcesso) {

                return erro(
                    `Trecho ${trechoIndex + 1}, ` +
                    `Fase ${faseIndex + 1}: ` +
                    "informe o Número do processo.",
                    numeroProcessoInput
                );
            }

            if (!numeroLicenciamento) {

                return erro(
                    `Trecho ${trechoIndex + 1}, ` +
                    `Fase ${faseIndex + 1}: ` +
                    "informe o Nº do licenciamento.",
                    numeroLicenciamentoInput
                );
            }


            if (!situacao) {

                return erro(
                    `Trecho ${trechoIndex + 1}, ` +
                    `Fase ${faseIndex + 1}: ` +
                    "selecione a Situação.",
                    situacaoInput
                );
            }


            const faseEmitida =
                situacao.toLowerCase() ===
                    "emitido" ||
                situacao.toLowerCase() ===
                    "emitida";


            if (faseEmitida) {

                const numeroFaseInput =
                    faseCard.querySelector(
                        ".fase-numero"
                    );

                const dataEmissaoInput =
                    faseCard.querySelector(
                        ".fase-data-emissao"
                    );

                const dataValidadeInput =
                    faseCard.querySelector(
                        ".fase-data-validade"
                    );


                const numeroFase =
                    numeroFaseInput
                        ?.value
                        ?.trim() ?? "";

                const dataEmissao =
                    dataEmissaoInput
                        ?.value ?? "";

                const dataValidade =
                    dataValidadeInput
                        ?.value ?? "";


                if (!numeroFase) {

                    return erro(
                        `Trecho ${trechoIndex + 1}, ` +
                        `Fase ${faseIndex + 1}: ` +
                        "informe o Nº da fase.",
                        numeroFaseInput
                    );
                }


                if (!dataEmissao) {

                    return erro(
                        `Trecho ${trechoIndex + 1}, ` +
                        `Fase ${faseIndex + 1}: ` +
                        "informe a Data de emissão.",
                        dataEmissaoInput
                    );
                }


                if (!dataValidade) {

                    return erro(
                        `Trecho ${trechoIndex + 1}, ` +
                        `Fase ${faseIndex + 1}: ` +
                        "informe a Data de validade.",
                        dataValidadeInput
                    );
                }


                if (
                    new Date(dataValidade) <
                    new Date(dataEmissao)
                ) {

                    return erro(
                        `Trecho ${trechoIndex + 1}, ` +
                        `Fase ${faseIndex + 1}: ` +
                        "a Data de validade não pode ser " +
                        "anterior à Data de emissão.",
                        dataValidadeInput
                    );
                }
            }
        }


        const complementares =
            Array.from(
                card.querySelectorAll(
                    ".fase-complementar-item"
                )
            );


        for (
            let complementarIndex = 0;
            complementarIndex < complementares.length;
            complementarIndex++
        ) {

            const complementar =
                complementares[
                    complementarIndex
                ];


            const faseInput =
                complementar.querySelector(
                    ".fase-complementar-tipo"
                );

            const dataInput =
                complementar.querySelector(
                    ".fase-complementar-data"
                );


            if (!faseInput?.value?.trim()) {

                return erro(
                    `Trecho ${trechoIndex + 1}, ` +
                    `Fase Complementar ${complementarIndex + 1}: ` +
                    "selecione a fase.",
                    faseInput
                );
            }


            if (!dataInput?.value) {

                return erro(
                    `Trecho ${trechoIndex + 1}, ` +
                    `Fase Complementar ${complementarIndex + 1}: ` +
                    "informe a Data de emissão.",
                    dataInput
                );
            }
        }
    }


    const cardsPendencias =
        Array.from(
            document.querySelectorAll(
                ".edit-pendencia-card"
            )
        );


    for (
        let pendenciaIndex = 0;
        pendenciaIndex < cardsPendencias.length;
        pendenciaIndex++
    ) {

        const card =
            cardsPendencias[
                pendenciaIndex
            ];


        const descricaoInput =
            card.querySelector(
                ".pendencia-descricao"
            );

        const divisaoInput =
            card.querySelector(
                ".pendencia-divisao"
            );

        const situacaoInput =
            card.querySelector(
                ".pendencia-situacao"
            );

        const faseVinculadaInput =
            card.querySelector(
                ".pendencia-fase-vinculada"
            );

        const dataEntradaInput =
            card.querySelector(
                ".pendencia-data-entrada"
            );

        const prazoInput =
            card.querySelector(
                ".pendencia-prazo"
            );

        const dataSaidaInput =
            card.querySelector(
                ".pendencia-data-saida"
            );


        if (
            !descricaoInput
                ?.value
                ?.trim()
        ) {

            return erro(
                `Pendência ${pendenciaIndex + 1}: ` +
                "preencha a Descrição.",
                descricaoInput
            );
        }


        if (!divisaoInput?.value) {

            return erro(
                `Pendência ${pendenciaIndex + 1}: ` +
                "selecione a Divisão CAP.",
                divisaoInput
            );
        }


        if (
            faseVinculadaInput &&
            !faseVinculadaInput.value
        ) {

            return erro(
                `Pendência ${pendenciaIndex + 1}: ` +
                "selecione a Fase vinculada.",
                faseVinculadaInput
            );
        }


        if (!dataEntradaInput?.value) {

            return erro(
                `Pendência ${pendenciaIndex + 1}: ` +
                "informe a Data de entrada.",
                dataEntradaInput
            );
        }


        if (!prazoInput?.value) {

            return erro(
                `Pendência ${pendenciaIndex + 1}: ` +
                "informe o Prazo.",
                prazoInput
            );
        }


        if (
            dataEntradaInput?.value &&
            prazoInput?.value &&
            new Date(prazoInput.value) <
            new Date(dataEntradaInput.value)
        ) {

            return erro(
                `Pendência ${pendenciaIndex + 1}: ` +
                "o Prazo não pode ser anterior " +
                "à Data de entrada.",
                prazoInput
            );
        }


        const atribuicoes =
            Array.from(
                card.querySelectorAll(
                    ".atribuicao-checkbox:checked"
                )
            );


        if (atribuicoes.length === 0) {

            const primeiraAtribuicao =
                card.querySelector(
                    ".atribuicao-checkbox"
                );

            return erro(
                `Pendência ${pendenciaIndex + 1}: ` +
                "selecione pelo menos uma opção em Atribuído a.",
                primeiraAtribuicao
            );
        }


        const possuiRegional =
            atribuicoes.some(
                checkbox =>
                    checkbox.value ===
                    "Regional"
            );


        if (possuiRegional) {

            const regionais =
                card.querySelector(
                    ".pendencia-regionais"
                );


            if (
                !regionais ||
                regionais.selectedOptions
                    .length === 0
            ) {

                return erro(
                    `Pendência ${pendenciaIndex + 1}: ` +
                    "selecione pelo menos uma Regional.",
                    regionais
                );
            }
        }


        const situacao =
            situacaoInput?.value ?? "";


        if (
            situacao === "Atendida" &&
            !dataSaidaInput?.value
        ) {

            return erro(
                `Pendência ${pendenciaIndex + 1}: ` +
                "informe a Data de saída.",
                dataSaidaInput
            );
        }


        const historicos =
            Array.from(
                card.querySelectorAll(
                    ".historico-edit-card"
                )
            );


        for (
            let historicoIndex = 0;
            historicoIndex < historicos.length;
            historicoIndex++
        ) {

            const historico =
                historicos[
                    historicoIndex
                ];


            const dataInput =
                historico.querySelector(
                    ".historico-data"
                );

            const textoInput =
                historico.querySelector(
                    ".historico-texto"
                );


            const data =
                dataInput?.value ?? "";

            const texto =
                textoInput
                    ?.value
                    ?.trim() ?? "";

            if (!data && !texto) {
                continue;
            }


            if (!data) {

                return erro(
                    `Pendência ${pendenciaIndex + 1}, ` +
                    `Histórico ${historicoIndex + 1}: ` +
                    "informe a Data.",
                    dataInput
                );
            }


            if (!texto) {

                return erro(
                    `Pendência ${pendenciaIndex + 1}, ` +
                    `Histórico ${historicoIndex + 1}: ` +
                    "preencha o Histórico.",
                    textoInput
                );
            }
        }
    }

    const historicoData =
        document.getElementById(
            "historicoProcessoData"
        );

    const historicoTexto =
        document.getElementById(
            "historicoProcessoTexto"
        );


    const temDataHistorico =
        Boolean(
            historicoData?.value
        );

    const temTextoHistorico =
        Boolean(
            historicoTexto
                ?.value
                ?.trim()
        );


    if (
        temDataHistorico &&
        !temTextoHistorico
    ) {

        return erro(
            "Preencha a descrição do Histórico do Processo.",
            historicoTexto
        );
    }


    if (
        temTextoHistorico &&
        !temDataHistorico
    ) {

        return erro(
            "Informe a data do Histórico do Processo.",
            historicoData
        );
    }


    return true;
}


function configurarBotoes() {

    const form =
        document.getElementById(
            "formProcesso"
        );


    const btnCancelar =
        document.getElementById(
            "btnCancelar"
        );

    const btnAdicionarTecnico =
        document.getElementById(
            "btnAdicionarTecnico"
        );

    const listaTecnicos =
        document.getElementById(
            "listaTecnicos"
        );

    const btnAdicionarTrecho =
        document.getElementById(
            "btnAdicionarTrecho"
        );

    const btnAdicionarPendencia =
        document.getElementById(
            "btnAdicionarPendencia"
        );


    btnCancelar.addEventListener(
        "click",
        () => {
            window.location.href =
                "./processos.html";
        }
    );

    btnAdicionarTecnico?.addEventListener(
        "click",
        () => {

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
                ?.addEventListener(
                    "click",
                    () => {
                        bloco.remove();
                    }
                );

            listaTecnicos.appendChild(
                bloco
            );
        }
    );

    btnAdicionarTrecho.addEventListener(
        "click",
        () => {

            atualizarTrechosCadastroPelaTela();

            trechosCadastro.push({
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
                        fase: "",
                        numeroProcesso: "",
                        numeroLicenciamento: "",
                        statusFase: "",
                        numeroFase: "",
                        dataEmissaoFase: null,
                        dataValidadeFase: null
                    }
                ],

                fasesComplementares: []
            });

            renderizarTrechosEdicao(
                trechosCadastro
            );
        }
    );

    btnAdicionarPendencia.addEventListener(
        "click",
        () => {

            atualizarTrechosCadastroPelaTela();
            atualizarPendenciasCadastroPelaTela();

            pendenciasCadastro.push({
                id: 0,
                descricao: "",
                providencia: "",
                divisaoCap: "",
                situacao: "Aberta",
                dataEntrada: null,
                prazo: null,
                dataSaida: null,

                atribuidoA: [],
                regionais: [],

                faseVinculadaRef: null,
                historicos: []
            });

            renderizarPendenciasEdicao(
                pendenciasCadastro
            );
        }
    );


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            if (!validarFormularioNovoProcesso()) {
                return;
            }

            const TAMANHO_MAXIMO_PDF =
                20 * 1024 * 1024;


            const inputsAnexos =
                Array.from(
                    document.querySelectorAll(
                        ".fase-anexo, .fase-complementar-anexo"
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

            atualizarTrechosCadastroPelaTela();
            atualizarPendenciasCadastroPelaTela();


            const primeiraFaseAtual =
                trechosCadastro
                    .map(trecho => {

                        const fases =
                            trecho.fases ?? [];

                        return fases.length > 0
                            ? fases[fases.length - 1]
                            : null;
                    })
                    .find(fase => fase !== null)
                    ?? {};


            const payload = {

                idEmpreendimento: "",

                empreendimento:
                    document
                        .getElementById("empreendimento")
                        ?.value ?? "",

                interessado:
                    document
                        .getElementById("interessado")
                        ?.value
                        ?.trim() ?? "",

                tecnicoResponsavel:
                    obterTecnicosResponsaveis(),


                classificacao: null,

                divisaoCap: null,


                identificacaoEmpreendimento:
                    document
                        .getElementById(
                            "identificacaoEmpreendimento"
                        )
                        ?.value
                        ?.trim() ?? "",

                caracterizacaoEmpreendimento:
                    document
                        .getElementById(
                            "caracterizacaoEmpreendimento"
                        )
                        ?.value
                        ?.trim() ?? "",

                situacao: "Aberta",


                dataEntrada: null,
                prazo: null,
                dataSaida: null,

                fase:
                    primeiraFaseAtual.fase ?? "",

                statusFase:
                    primeiraFaseAtual.statusFase ?? "",

                numeroFase:
                    primeiraFaseAtual.numeroFase ?? "",

                dataEmissaoFase:
                    primeiraFaseAtual.dataEmissaoFase ?? null,

                dataValidadeFase:
                    primeiraFaseAtual.dataValidadeFase ?? null,

                anexoFase: null,


                historicoProcessoData:
                    document
                        .getElementById(
                            "historicoProcessoData"
                        )
                        ?.value || null,

                historicoProcessoTexto:
                    document
                        .getElementById(
                            "historicoProcessoTexto"
                        )
                        ?.value
                        ?.trim() || "",


                trechos:
                    trechosCadastro,

                pendencias:
                    pendenciasCadastro,

                fasesComplementares: []
            };


            console.log(
                "Payload novo processo:",
                payload
            );

            try {

                const response =
                    await fetch(
                        `${API_URL}/processos`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify(payload)
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


                const processoCriado =
                    await response.json();

                for (
                    const [trechoIndex, trechoResultado]
                    of (processoCriado.trechos ?? []).entries()
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

                        if (
                            !arquivo ||
                            faseResultado.statusFase !== "Emitido"
                        ) {
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
                                "Erro ao enviar anexo da fase."
                            );
                        }
                    }

                    const arquivosDoTrecho =
                        arquivosFasesComplementares[
                            trechoIndex
                        ] ?? [];


                    for (
                        const [complementarIndex, complementarResultado]
                        of (
                            trechoResultado.fasesComplementares ?? []
                        ).entries()
                    ) {

                        const arquivo =
                            arquivosDoTrecho[
                                complementarIndex
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
                    "Processo cadastrado com sucesso."
                );


                window.location.href =
                    `./processo.html?id=${processoCriado.id}`;

            }
            catch (error) {

                console.error(
                    "Erro ao cadastrar processo:",
                    error
                );


                alert(
                    "Não foi possível cadastrar o processo. " +
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

        if (!btnExcluir) {
            return;
        }


        const card =
            btnExcluir.closest(
                ".edit-trecho-card"
            );

        if (!card) {
            return;
        }


        const cards =
            Array.from(
                document.querySelectorAll(
                    ".edit-trecho-card"
                )
            );

        const trechoIndex =
            cards.indexOf(card);


        if (trechoIndex < 0) {
            return;
        }


        const confirmar =
            window.confirm(
                "Deseja realmente excluir este trecho?"
            );

        if (!confirmar) {
            return;
        }

        atualizarTrechosCadastroPelaTela();

        trechosCadastro.splice(
            trechoIndex,
            1
        );

        arquivosFasesComplementares.splice(
            trechoIndex,
            1
        );

        arquivosFasesTrecho.splice(
            trechoIndex,
            1
        );


        renderizarTrechosEdicao(
            trechosCadastro
        );

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