const API_URL = "http://localhost:5161/api";

let processoAtual = null;
let trechosCadastro = [];
let pendenciasCadastro = [];


document.addEventListener(
    "DOMContentLoaded",
    () => {

        iniciarCadastro();

    }
);

function iniciarCadastro() {

    processoAtual = null;

    document
        .getElementById("carregando")
        .hidden = true;

    document
        .getElementById("erroProcesso")
        .hidden = true;

    document
        .getElementById("formProcesso")
        .hidden = false;


    document
        .getElementById("idEmpreendimento")
        .value = "";

    document
        .getElementById("identificacaoEmpreendimento")
        .value = "";

    document
        .getElementById("caracterizacaoEmpreendimento")
        .value = "";

    document
        .getElementById("empreendimento")
        .value = "";

    document
        .getElementById("classificacao")
        .value = "";

    document
        .getElementById("interessado")
        .value = "";

    document
        .getElementById("tecnicoResponsavel")
        .value = "";

    document
        .getElementById("historicoProcessoData")
        .value = "";

    document
        .getElementById("historicoProcessoTexto")
        .value = "";


    trechosCadastro = [];
    pendenciasCadastro = [];

    renderizarTrechosEdicao(trechosCadastro);
    renderizarPendenciasEdicao(pendenciasCadastro);


    configurarBotoes();
    configurarSelectsCustomizados();
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
    .getElementById("classificacao")
    .value =
        processo.classificacao ?? "";


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


                <div class="form-grid form-grid-3">

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

                <button
                    type="button"
                    class="button-danger btn-excluir-trecho"
                >
                    Excluir
                </button>

            `;


            container.appendChild(
                blocoTrecho
            );

        }
    );

    configurarBuscaRodovias();
    configurarValidacaoKmTrechos();

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


            if (
                rodovia.dataset
                    .validacaoKmConfigurada ===
                "true"
            ) {
                return;
            }


            rodovia.dataset
                .validacaoKmConfigurada =
                "true";


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

            const resultados =
                card.querySelector(
                    ".rodovia-resultados"
                );


            if (
                !inputRodovia ||
                !inputRodId ||
                !resultados
            ) {
                return;
            }


            if (
                inputRodovia.dataset
                    .buscaRodoviaConfigurada ===
                "true"
            ) {
                return;
            }


            inputRodovia.dataset
                .buscaRodoviaConfigurada =
                "true";


            let rodoviasEncontradas = [];
            let timerBusca = null;


            function fecharResultados() {

                resultados.hidden = true;
                resultados.innerHTML = "";

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


                fecharResultados();


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


                    if (termo.length < 2) {

                        rodoviasEncontradas = [];

                        fecharResultados();

                        return;

                    }


                    timerBusca = setTimeout(
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


                                rodoviasEncontradas =
                                    Array.isArray(dados)
                                        ? dados
                                        : [];


                                resultados.innerHTML =
                                    "";


                                if (
                                    rodoviasEncontradas
                                        .length === 0
                                ) {

                                    resultados.hidden =
                                        true;

                                    return;

                                }


                                rodoviasEncontradas
                                    .forEach(
                                        (rodovia) => {

                                            const opcao =
                                                document
                                                    .createElement(
                                                        "button"
                                                    );

                                            opcao.type =
                                                "button";

                                            opcao.className =
                                                "rodovia-resultado-item";

                                            opcao.textContent =
                                                rodovia
                                                    .rodCodigo ??
                                                "";

                                            opcao.addEventListener(
                                                "click",
                                                () => {

                                                    selecionarRodovia(
                                                        rodovia
                                                    );

                                                }
                                            );


                                            resultados
                                                .appendChild(
                                                    opcao
                                                );

                                        }
                                    );


                                resultados.hidden =
                                    false;

                            }
                            catch (error) {

                                console.error(
                                    "Erro ao buscar rodovias:",
                                    error
                                );

                                rodoviasEncontradas =
                                    [];

                                fecharResultados();

                            }

                        },
                        300
                    );

                }
            );


            inputRodovia.addEventListener(
                "focus",
                () => {

                    if (
                        resultados.children
                            .length > 0
                    ) {

                        resultados.hidden =
                            false;

                    }

                }
            );


            document.addEventListener(
                "click",
                (event) => {

                    if (
                        !card.contains(
                            event.target
                        )
                    ) {

                        fecharResultados();

                    }

                }
            );

        });

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

            btnExcluirPendencia?.addEventListener(
                "click",
                () => {

                    atualizarPendenciasCadastroPelaTela();

                    const cards =
                        Array.from(
                            document.querySelectorAll(
                                ".edit-pendencia-card"
                            )
                        );

                    const pendenciaIndex =
                        cards.indexOf(pendenciaCard);

                    if (pendenciaIndex < 0) {
                        return;
                    }

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
                        !listaHistoricos.querySelector(
                            ".historico-edit-card"
                        )
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

function atualizarTrechosCadastroPelaTela() {

    trechosCadastro = Array
        .from(
            document.querySelectorAll(
                ".edit-trecho-card"
            )
        )
        .map((card) => {

            const rodId =
                Number(
                    card.querySelector(
                        ".trecho-rod-id"
                    )?.value ?? 0
                );

            const rodCodigo =
                card.querySelector(
                    ".trecho-rodovia"
                )?.value?.trim() ?? "";

            const inputRodovia =
                card.querySelector(
                    ".trecho-rodovia"
                );

            const rodKmInicial =
                inputRodovia?.dataset.kmInicial ?? "";

            const rodKmFinal =
                inputRodovia?.dataset.kmFinal ?? "";

            const kmInicialValor =
                card.querySelector(
                    ".trecho-km-inicial"
                )?.value;

            const kmFinalValor =
                card.querySelector(
                    ".trecho-km-final"
                )?.value;

            return {
                id:
                    Number(
                        card.querySelector(
                            ".trecho-id"
                        )?.value ?? 0
                    ),

                rodId,

                rodovia: {
                    rodId,
                    rodCodigo,
                    rodKmInicial,
                    rodKmFinal
                },

                kmInicial:
                    kmInicialValor === ""
                        ? null
                        : Number(kmInicialValor),

                kmFinal:
                    kmFinalValor === ""
                        ? null
                        : Number(kmFinalValor)
            };
        });
}

function atualizarPendenciasCadastroPelaTela() {

    pendenciasCadastro = Array
        .from(
            document.querySelectorAll(
                ".edit-pendencia-card"
            )
        )
        .map((card) => {

            const atribuidoA = Array
                .from(
                    card.querySelectorAll(
                        ".atribuicao-checkbox:checked"
                    )
                )
                .map((checkbox) =>
                    checkbox.value
                );


            const regionaisSelect =
                card.querySelector(
                    ".pendencia-regionais"
                );

            const regionais =
                regionaisSelect
                    ? Array
                        .from(
                            regionaisSelect.selectedOptions
                        )
                        .map((option) =>
                            option.value
                        )
                    : [];


            const historicos = Array
                .from(
                    card.querySelectorAll(
                        ".historico-edit-card"
                    )
                )
                .map((historicoCard) => ({

                    id:
                        Number(
                            historicoCard.querySelector(
                                ".historico-id"
                            )?.value ?? 0
                        ),

                    data:
                        historicoCard.querySelector(
                            ".historico-data"
                        )?.value || null,

                    texto:
                        historicoCard.querySelector(
                            ".historico-texto"
                        )?.value?.trim() ?? ""

                }));


            return {

                id:
                    Number(
                        card.querySelector(
                            ".pendencia-id"
                        )?.value ?? 0
                    ),

                descricao:
                    card.querySelector(
                        ".pendencia-descricao"
                    )?.value?.trim() ?? "",

                divisaoCap:
                    card.querySelector(
                        ".pendencia-divisao"
                    )?.value ?? "",

                situacao:
                    card.querySelector(
                        ".pendencia-situacao"
                    )?.value ?? "",

                dataEntrada:
                    card.querySelector(
                        ".pendencia-data-entrada"
                    )?.value || null,

                prazo:
                    card.querySelector(
                        ".pendencia-prazo"
                    )?.value || null,

                dataSaida:
                    card.querySelector(
                        ".pendencia-data-saida"
                    )?.value || null,

                atribuidoA,

                regionais,

                historicos

            };
        });
}

function obterTecnicosResponsaveis() {

    return Array.from(
        document.querySelectorAll(
            ".tecnico-responsavel"
        )
    )
    .map(
        input => input.value.trim()
    )
    .filter(
        tecnico => tecnico !== ""
    );

}

function adicionarTecnicoResponsavel() {

    const listaTecnicos =
        document.getElementById(
            "listaTecnicos"
        );

    if (!listaTecnicos) {
        return;
    }


    const item =
        document.createElement("div");

    item.className =
        "tecnico-responsavel-item";


    item.innerHTML = `

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


    listaTecnicos.appendChild(
        item
    );

}

document.addEventListener(
    "click",
    (event) => {

        const btnRemoverTecnico =
            event.target.closest(
                ".btn-remover-tecnico"
            );

        if (!btnRemoverTecnico) {
            return;
        }


        const item =
            btnRemoverTecnico.closest(
                ".tecnico-responsavel-item"
            );

        item?.remove();

    }
);

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


        atualizarTrechosCadastroPelaTela();


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

        if (trechoIndex === -1) {
            return;
        }


        trechosCadastro.splice(
            trechoIndex,
            1
        );


        renderizarTrechosEdicao(
            trechosCadastro
        );

    }
);

function validarFormularioNovoAcompanhamento() {

    function erro(mensagem, elemento) {

        alert(mensagem);

        elemento?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        elemento?.focus();

        return false;
    }


    // ==========================================
    // DADOS PRINCIPAIS
    // ==========================================

    const empreendimento =
        document.getElementById("empreendimento");

    const classificacao =
        document.getElementById("classificacao");

    const interessado =
        document.getElementById("interessado");

    const identificacao =
        document.getElementById(
            "identificacaoEmpreendimento"
        );

    const caracterizacao =
        document.getElementById(
            "caracterizacaoEmpreendimento"
        );


    if (!empreendimento?.value?.trim()) {

        return erro(
            "Selecione o Tipo do empreendimento.",
            empreendimento
        );
    }


    if (!classificacao?.value?.trim()) {

        return erro(
            "Selecione a Classificação.",
            classificacao
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


    // ==========================================
    // TÉCNICO RESPONSÁVEL
    // ==========================================

    const tecnicos =
        Array.from(
            document.querySelectorAll(
                ".tecnico-responsavel"
            )
        )
        .map(input => input.value.trim())
        .filter(Boolean);


    if (tecnicos.length === 0) {

        return erro(
            "Adicione pelo menos um Técnico Responsável.",
            document.querySelector(
                ".tecnico-responsavel"
            )
        );
    }


    // ==========================================
    // TRECHOS
    // ==========================================

    const cardsTrechos =
        Array.from(
            document.querySelectorAll(
                ".edit-trecho-card"
            )
        );


    if (cardsTrechos.length === 0) {

        alert(
            "Adicione pelo menos um trecho ao acompanhamento."
        );

        return false;
    }


    for (
        let indice = 0;
        indice < cardsTrechos.length;
        indice++
    ) {

        const card =
            cardsTrechos[indice];


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
                `Trecho ${indice + 1}: selecione uma rodovia.`,
                rodoviaInput
            );
        }


        if (kmInicialTexto === "") {

            return erro(
                `Trecho ${indice + 1}: o KM Inicial é obrigatório.`,
                kmInicialInput
            );
        }


        if (kmFinalTexto === "") {

            return erro(
                `Trecho ${indice + 1}: o KM Final é obrigatório.`,
                kmFinalInput
            );
        }


        const kmInicial =
            Number(kmInicialTexto);

        const kmFinal =
            Number(kmFinalTexto);


        if (!Number.isFinite(kmInicial)) {

            return erro(
                `Trecho ${indice + 1}: o KM Inicial é inválido.`,
                kmInicialInput
            );
        }


        if (!Number.isFinite(kmFinal)) {

            return erro(
                `Trecho ${indice + 1}: o KM Final é inválido.`,
                kmFinalInput
            );
        }


        if (kmInicial > kmFinal) {

            return erro(
                `Trecho ${indice + 1}: ` +
                "o KM Inicial não pode ser maior que o KM Final.",
                kmInicialInput
            );
        }


        // Limites cadastrados da rodovia

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
                    `Trecho ${indice + 1}: ` +
                    `o intervalo permitido desta rodovia é ` +
                    `de KM ${limiteInicial} até KM ${limiteFinal}.`,
                    kmInicialInput
                );
            }
        }
    }


    // ==========================================
    // PENDÊNCIAS
    // ==========================================

    const cardsPendencias =
        Array.from(
            document.querySelectorAll(
                ".edit-pendencia-card"
            )
        );


    for (
        let indice = 0;
        indice < cardsPendencias.length;
        indice++
    ) {

        const card =
            cardsPendencias[indice];


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


        if (!descricaoInput?.value?.trim()) {

            return erro(
                `Pendência ${indice + 1}: preencha a Descrição.`,
                descricaoInput
            );
        }


        if (!divisaoInput?.value) {

            return erro(
                `Pendência ${indice + 1}: selecione a Divisão CAP.`,
                divisaoInput
            );
        }


        if (!situacaoInput?.value) {

            return erro(
                `Pendência ${indice + 1}: selecione a Situação.`,
                situacaoInput
            );
        }


        if (!dataEntradaInput?.value) {

            return erro(
                `Pendência ${indice + 1}: informe a Data de entrada.`,
                dataEntradaInput
            );
        }


        if (!prazoInput?.value) {

            return erro(
                `Pendência ${indice + 1}: informe o Prazo.`,
                prazoInput
            );
        }


        if (
            new Date(prazoInput.value) <
            new Date(dataEntradaInput.value)
        ) {

            return erro(
                `Pendência ${indice + 1}: ` +
                "o Prazo não pode ser anterior à Data de entrada.",
                prazoInput
            );
        }


        // ======================================
        // ATRIBUÍDO A
        // ======================================

        const atribuicoes =
            Array.from(
                card.querySelectorAll(
                    ".atribuicao-checkbox:checked"
                )
            );


        if (atribuicoes.length === 0) {

            return erro(
                `Pendência ${indice + 1}: ` +
                "selecione pelo menos uma opção em Atribuído a.",
                card.querySelector(
                    ".atribuicao-checkbox"
                )
            );
        }


        const regionalMarcada =
            atribuicoes.some(
                checkbox =>
                    checkbox.value === "Regional"
            );


        if (regionalMarcada) {

            const regionaisInput =
                card.querySelector(
                    ".pendencia-regionais"
                );


            if (
                !regionaisInput ||
                regionaisInput
                    .selectedOptions
                    .length === 0
            ) {

                return erro(
                    `Pendência ${indice + 1}: ` +
                    "selecione pelo menos uma Regional.",
                    regionaisInput
                );
            }
        }


        // ======================================
        // PENDÊNCIA ATENDIDA
        // ======================================

        if (
            situacaoInput.value === "Atendida" &&
            !dataSaidaInput?.value
        ) {

            return erro(
                `Pendência ${indice + 1}: ` +
                "informe a Data de saída.",
                dataSaidaInput
            );
        }


        if (
            dataSaidaInput?.value &&
            dataEntradaInput?.value &&
            new Date(dataSaidaInput.value) <
            new Date(dataEntradaInput.value)
        ) {

            return erro(
                `Pendência ${indice + 1}: ` +
                "a Data de saída não pode ser anterior à Data de entrada.",
                dataSaidaInput
            );
        }


        // ======================================
        // HISTÓRICOS DA PENDÊNCIA
        // ======================================

        const historicos =
            Array.from(
                card.querySelectorAll(
                    ".historico-edit-card"
                )
            );


        for (
            let h = 0;
            h < historicos.length;
            h++
        ) {

            const historico =
                historicos[h];

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
                textoInput?.value?.trim() ?? "";


            // Se os dois estiverem vazios,
            // ignoramos o histórico.
            if (!data && !texto) {
                continue;
            }


            if (!data) {

                return erro(
                    `Pendência ${indice + 1}, ` +
                    `Histórico ${h + 1}: informe a Data.`,
                    dataInput
                );
            }


            if (!texto) {

                return erro(
                    `Pendência ${indice + 1}, ` +
                    `Histórico ${h + 1}: preencha o Histórico.`,
                    textoInput
                );
            }
        }
    }


    // ==========================================
    // HISTÓRICO DO ACOMPANHAMENTO
    // ==========================================

    const historicoData =
        document.getElementById(
            "historicoProcessoData"
        );

    const historicoTexto =
        document.getElementById(
            "historicoProcessoTexto"
        );


    const temData =
        Boolean(
            historicoData?.value
        );

    const temTexto =
        Boolean(
            historicoTexto
                ?.value
                ?.trim()
        );


    if (temData && !temTexto) {

        return erro(
            "Preencha a descrição do Histórico do acompanhamento.",
            historicoTexto
        );
    }


    if (temTexto && !temData) {

        return erro(
            "Informe a data do Histórico do acompanhamento.",
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

    const btnAdicionarTecnico =
        document.getElementById(
            "btnAdicionarTecnico"
        );
    
    const btnAdicionarTrecho =
        document.getElementById("btnAdicionarTrecho");

    const btnAdicionarPendencia =
        document.getElementById("btnAdicionarPendencia");


    const btnCancelar =
        document.getElementById(
            "btnCancelar"
        );


    btnCancelar.addEventListener(
        "click",
        () => {

            window.location.href =
                "./outros-acompanhamentos.html";

        }
    );

    btnAdicionarTecnico?.addEventListener(
        "click",
        () => {

            adicionarTecnicoResponsavel();

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
                kmFinal: null
            });

            renderizarTrechosEdicao(
                trechosCadastro
            );
        }
    );

    btnAdicionarPendencia.addEventListener(
        "click",
        () => {

            atualizarPendenciasCadastroPelaTela();

            pendenciasCadastro.push({

                id: 0,

                descricao: "",

                divisaoCap: "",

                situacao: "Aberta",

                dataEntrada: null,

                prazo: null,

                dataSaida: null,

                atribuidoA: [],

                regionais: [],

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

            if (!validarFormularioNovoAcompanhamento()) {
                return;
            }


            const classificacao =
                document
                    .getElementById("classificacao")
                    .value
                    .trim();


            // =========================
            // TRECHOS
            // =========================

            const trechos = [];

            const cardsTrechos =
                document.querySelectorAll(
                    ".edit-trecho-card"
                );


            for (
                let indice = 0;
                indice < cardsTrechos.length;
                indice++
            ) {

                const card =
                    cardsTrechos[indice];


                const rodoviaTexto =
                    card
                        .querySelector(
                            ".trecho-rodovia"
                        )
                        ?.value
                        ?.trim() ?? "";


                const rodId =
                    Number(
                        card
                            .querySelector(
                                ".trecho-rod-id"
                            )
                            ?.value ?? 0
                    );


                const kmInicialValor =
                    card
                        .querySelector(
                            ".trecho-km-inicial"
                        )
                        ?.value ?? "";


                const kmFinalValor =
                    card
                        .querySelector(
                            ".trecho-km-final"
                        )
                        ?.value ?? "";


                /*
                * Se o trecho foi criado mas ficou
                * completamente vazio, ignoramos.
                */
                const trechoVazio =
                    !rodoviaTexto &&
                    kmInicialValor === "" &&
                    kmFinalValor === "";


                if (trechoVazio) {

                    continue;
                }


                /*
                * Se alguma coisa foi preenchida,
                * precisa existir uma rodovia válida.
                */
                if (!rodId) {

                    alert(
                        `Trecho ${indice + 1}: ` +
                        "selecione uma rodovia válida."
                    );

                    return;
                }


                trechos.push({

                    rodId:

                        rodId,

                    kmInicial:

                        kmInicialValor === ""
                            ? null
                            : Number(kmInicialValor),

                    kmFinal:

                        kmFinalValor === ""
                            ? null
                            : Number(kmFinalValor),

                    /*
                    * Outros acompanhamentos
                    * não possui fases.
                    */
                    fases: []

                });
            }


            // =========================
            // PENDÊNCIAS
            // =========================

            const pendencias = [];

            const cardsPendencias =
                document.querySelectorAll(
                    ".edit-pendencia-card"
                );


            for (
                let indice = 0;
                indice < cardsPendencias.length;
                indice++
            ) {

                const card =
                    cardsPendencias[indice];


                const descricao =
                    card
                        .querySelector(
                            ".pendencia-descricao"
                        )
                        ?.value
                        ?.trim() ?? "";


                const divisaoCap =
                    card
                        .querySelector(
                            ".pendencia-divisao"
                        )
                        ?.value ?? "";


                const situacao =
                    card
                        .querySelector(
                            ".pendencia-situacao"
                        )
                        ?.value ?? "Aberta";


                const dataEntrada =
                    card
                        .querySelector(
                            ".pendencia-data-entrada"
                        )
                        ?.value ?? "";


                const prazo =
                    card
                        .querySelector(
                            ".pendencia-prazo"
                        )
                        ?.value ?? "";


                const dataSaida =
                    card
                        .querySelector(
                            ".pendencia-data-saida"
                        )
                        ?.value ?? "";


                // =========================
                // ATRIBUIÇÕES
                // =========================

                const atribuicoes =
                    Array
                        .from(
                            card.querySelectorAll(
                                ".atribuicao-checkbox:checked"
                            )
                        )
                        .map(
                            (checkbox) =>
                                checkbox.value
                        );


                // =========================
                // REGIONAIS
                // =========================

                const selectRegionais =
                    card.querySelector(
                        ".pendencia-regionais"
                    );


                let regionais = [];


                if (
                    atribuicoes.includes("Regional") &&
                    selectRegionais
                ) {

                    regionais =
                        Array
                            .from(
                                selectRegionais.selectedOptions
                            )
                            .map(
                                (option) =>
                                    option.value
                            );


                    if (regionais.length === 0) {

                        alert(
                            `Pendência ${indice + 1}: ` +
                            "selecione pelo menos uma Regional."
                        );

                        return;
                    }
                }


                // =========================
                // HISTÓRICOS DA PENDÊNCIA
                // =========================

                const historicos =
                    Array
                        .from(
                            card.querySelectorAll(
                                ".historico-edit-card"
                            )
                        )
                        .map((historicoCard) => {

                            const data =
                                historicoCard
                                    .querySelector(
                                        ".historico-data"
                                    )
                                    ?.value ?? "";


                            const texto =
                                historicoCard
                                    .querySelector(
                                        ".historico-texto"
                                    )
                                    ?.value
                                    ?.trim() ?? "";


                            return {

                                data:
                                    data || null,

                                texto:
                                    texto

                            };
                        })
                        .filter(
                            (historico) =>
                                historico.data ||
                                historico.texto
                        );


                /*
                * Se clicou em "+ Adicionar pendência"
                * mas deixou a pendência completamente
                * vazia, não cadastramos.
                *
                * A Situação "Aberta" não conta, pois
                * é apenas o valor padrão.
                */
                const pendenciaVazia =
                    !descricao &&
                    !divisaoCap &&
                    !dataEntrada &&
                    !prazo &&
                    !dataSaida &&
                    atribuicoes.length === 0 &&
                    historicos.length === 0;


                if (pendenciaVazia) {

                    continue;
                }


                pendencias.push({

                    descricao:
                        descricao,

                    situacao:
                        situacao,

                    divisaoCap:
                        divisaoCap,

                    dataEntrada:
                        dataEntrada || null,

                    prazo:
                        prazo || null,

                    dataSaida:
                        dataSaida || null,

                    atribuidoA:
                        atribuicoes,

                    regionais:
                        regionais,

                    /*
                    * Outros acompanhamentos
                    * não possui fase vinculada.
                    */
                    faseVinculadaRef:
                        null,

                    historicos:
                        historicos

                });
            }


            // =========================
            // PAYLOAD
            // =========================

            const payload = {

                empreendimento:
                    document
                        .getElementById(
                            "empreendimento"
                        )
                        .value,

                classificacao:
                    classificacao,

                interessado:
                    document
                        .getElementById(
                            "interessado"
                        )
                        .value
                        .trim(),

                tecnicoResponsavel:
                    obterTecnicosResponsaveis()
                        .join(";"),

                identificacaoEmpreendimento:
                    document
                        .getElementById(
                            "identificacaoEmpreendimento"
                        )
                        .value
                        .trim(),

                caracterizacaoEmpreendimento:
                    document
                        .getElementById(
                            "caracterizacaoEmpreendimento"
                        )
                        .value
                        .trim(),

                historicoProcessoData:
                    document
                        .getElementById(
                            "historicoProcessoData"
                        )
                        .value || null,

                historicoProcessoTexto:
                    document
                        .getElementById(
                            "historicoProcessoTexto"
                        )
                        .value
                        .trim(),


                /*
                * Estes campos pertencem ao Processo,
                * mas Outros acompanhamentos não os
                * utiliza diretamente.
                */
                divisaoCap:
                    null,

                dataEntrada:
                    null,

                prazo:
                    null,

                dataSaida:
                    null,


                trechos:
                    trechos,

                pendencias:
                    pendencias,


                /*
                * Outros acompanhamentos
                * não possui fases.
                */
                fasesComplementares:
                    [],

                fase: "",

                statusFase: "",
                
                numeroFase: "",

                dataEmissaoFase:
                    null,

                dataValidadeFase:
                    null,

                anexoFase:
                    null

            };


            console.log(
                "Payload novo acompanhamento:",
                payload
            );


            // =========================
            // POST
            // =========================

            try {

                const response =
                    await fetch(
                        `${API_URL}/processos`,
                        {
                            method:
                                "POST",

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


                const processoCriado =
                    await response.json();


                const novoId =
                    processoCriado.id ??
                    processoCriado.Id;


                if (!novoId) {

                    throw new Error(
                        "O backend criou o acompanhamento, " +
                        "mas não retornou o ID."
                    );
                }


                alert(
                    "Acompanhamento cadastrado com sucesso."
                );


                window.location.href =
                    `./acompanhamento.html?id=${novoId}`;

            }
            catch (error) {

                console.error(
                    "Erro ao cadastrar acompanhamento:",
                    error
                );


                alert(
                    "Não foi possível cadastrar o acompanhamento. " +
                    "Veja o console para mais detalhes."
                );
            }

        }
    );

}


function mostrarErro() {

    document
        .getElementById("carregando")
        .hidden = true;


    document
        .getElementById("erroProcesso")
        .hidden = false;

}