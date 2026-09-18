const API_URL = "http://localhost:5161/api";

let todosProcessos = [];
let processosExibidos = [];


document.addEventListener("DOMContentLoaded", () => {

    carregarProcessos();

    configurarFiltros();
    configurarBotoes();

});


async function carregarProcessos() {

    try {

        const response = await fetch(`${API_URL}/processos`);

        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}`);
        }

        const dados = await response.json();

        // A API possui Processos e Outros acompanhamentos.
        // Nesta página mostramos somente Outros acompanhamentos.
        todosProcessos = dados.filter((processo) => {

            if (processo.pagina) {
                return processo.pagina === "Outros acompanhamentos";
            }

            const classificacao =
                String(processo.classificacao ?? "")
                    .trim()
                    .toUpperCase();

            return [
                "SUP.OBRA",
                "OP-FAUNA",
                "OUTROS"
            ].includes(classificacao);
        });

        preencherFiltros();
        configurarMultiselectTecnicos();
        configurarSelectsCustomizados();
        aplicarFiltros();

    } catch (error) {

        console.error(
            "Erro ao carregar processos:",
            error
        );

        const estadoVazio =
            document.getElementById("estadoVazio");

        estadoVazio.hidden = false;
        estadoVazio.textContent =
            "Não foi possível carregar os processos.";

    }

}


function configurarFiltros() {

    const ids = [
        "busca",
        "filtroSituacao",
        "filtroTecnico",
        "filtroClassificacao",
        "filtroAtribuido",
        "filtroDivisao",
        "filtroRodovia"
    ];

    ids.forEach((id) => {

        const elemento = document.getElementById(id);

        if (!elemento) {
            return;
        }

        elemento.addEventListener(
            id === "busca" ? "input" : "change",
            aplicarFiltros
        );

    });

}


function aplicarFiltros() {

    const termo =
        document
            .getElementById("busca")
            .value
            .trim()
            .toLowerCase();

    const situacao =
        document.getElementById("filtroSituacao").value;

    const tecnicosSelecionados = Array.from(
        document.getElementById("filtroTecnico").selectedOptions
    )
        .map((option) => option.value.trim())
        .filter(Boolean);

    const classificacao =
        document.getElementById(
            "filtroClassificacao"
        ).value;

    const atribuido =
        document.getElementById("filtroAtribuido").value;

    const divisao =
        document.getElementById("filtroDivisao").value;

    const rodovia =
        document.getElementById("filtroRodovia").value;


    const filtrados = todosProcessos.filter((processo) => {

        const situacaoProcesso =
            obterSituacao(processo);

        const classificacaoSelecionada =
            filtroClassificacao?.value ?? "";

        const casaClassificacao =
            !classificacaoSelecionada ||
            processo.classificacao ===
                classificacaoSelecionada;

        const codigoRodovia =
            obterCodigoRodovia(processo);

        const divisaoCap =
            obterDivisaoCap(processo);

        const atribuicoes =
            obterAtribuicoes(processo);


        const camposBusca = [
            processo.idEmpreendimento ?? "",
            processo.identificacaoEmpreendimento ?? "",
            processo.empreendimento ?? "",
            processo.interessado ?? "",
            processo.tecnicoResponsavel ?? "",
            processo.classificacao ?? "",
            codigoRodovia,
            divisaoCap
        ];

        const correspondeBusca =
            !termo ||
            camposBusca.some((campo) =>
                String(campo)
                    .toLowerCase()
                    .includes(termo)
            );


        const correspondeSituacao =
            !situacao ||
            situacaoProcesso === situacao;


        const tecnicosDoProcesso =
            String(processo.tecnicoResponsavel ?? "")
                .split(";")
                .map((nome) => nome.trim())
                .filter(Boolean);

        const correspondeTecnico =
            tecnicosSelecionados.length === 0 ||
            tecnicosSelecionados.some((nome) =>
                tecnicosDoProcesso.includes(nome)
            );


        const correspondeClassificacao =
            !classificacao ||
            classificacaoProcesso === classificacao;


        const correspondeAtribuido =
            !atribuido ||
            atribuicoes.includes(atribuido);


        const correspondeDivisao =
            !divisao ||
            divisaoCap === divisao;


        const correspondeRodovia =
            !rodovia ||
            codigoRodovia === rodovia;


        return (
            correspondeBusca &&
            correspondeSituacao &&
            correspondeTecnico &&
            correspondeClassificacao &&
            correspondeAtribuido &&
            correspondeDivisao &&
            correspondeRodovia
        );

    });


    renderizarProcessos(filtrados);

}


function renderizarProcessos(processos) {

    processosExibidos = [...processos];

    const tbody =
        document.getElementById("processosBody");

    const estadoVazio =
        document.getElementById("estadoVazio");

    tbody.innerHTML = "";


    if (processos.length === 0) {

        estadoVazio.hidden = false;

    } else {

        estadoVazio.hidden = true;

    }


    processos.forEach((processo) => {

        const linha =
            document.createElement("tr");


        const idEmpreendimento =
            processo.idEmpreendimento ?? "Sem número";

        const codigo =
            obterCodigoRodovia(processo) || "—";

        const identificacao =
            processo.identificacaoEmpreendimento || "—";

        const classificacao =
            processo.classificacao || "—";

        const divisao =
            obterDivisaoCap(processo) || "—";

        const tecnico =
            processo.tecnicoResponsavel || "—";

        const prazo =
            obterPrazo(processo);

        const situacao =
            obterSituacao(processo);


        linha.innerHTML = `
            <td>
                <a
                    href="./acompanhamento.html?id=${processo.id}"
                    class="process-number process-link"
                >
                    ${escapeHtml(idEmpreendimento)}
                </a>
            </td>

            <td>
                ${escapeHtml(codigo)}
            </td>

            <td>
                ${escapeHtml(identificacao)}
            </td>

            <td>
                ${escapeHtml(classificacao)}
            </td>

            <td>
                ${escapeHtml(divisao)}
            </td>

            <td>
                ${escapeHtml(tecnico)}
            </td>

            <td>
                ${escapeHtml(prazo)}
            </td>

            <td>
                <span class="status-badge ${classeSituacao(situacao)}">
                    ${escapeHtml(situacao)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="action-button"
                    data-id="${processo.id}"
                    title="Ações"
                >
                    ⋮
                </button>
            </td>
        `;

        tbody.appendChild(linha);

    });

    document
        .querySelectorAll(".action-button")
        .forEach((botao) => {

            botao.addEventListener("click", (event) => {
                event.stopPropagation();

                // Fecha qualquer menu já aberto
                document
                    .querySelectorAll(".action-menu")
                    .forEach(menu => menu.remove());

                const id = botao.dataset.id;

                const menu =
                    document.createElement("div");

                menu.className = "action-menu";

                menu.innerHTML = `
                    <button
                        type="button"
                        class="action-menu-item"
                        data-acao="visualizar"
                    >
                        <i data-lucide="eye"></i>
                        <span>Ver detalhes</span>
                    </button>

                    <button
                        type="button"
                        class="action-menu-item"
                        data-acao="editar"
                    >
                        <i data-lucide="pencil"></i>
                        <span>Editar</span>
                    </button>

                    <div class="action-menu-divider"></div>

                    <button
                        type="button"
                        class="action-menu-item action-menu-delete"
                        data-acao="excluir"
                    >
                        <i data-lucide="trash-2"></i>
                        <span>Excluir</span>
                    </button>
                `;

                menu.style.position = "absolute";
                menu.style.zIndex = "9999";

                document.body.appendChild(menu);

                if (window.lucide) {
                    lucide.createIcons();
                }

                const posicao =
                    botao.getBoundingClientRect();

                menu.style.top =
                    `${posicao.bottom + window.scrollY + 4}px`;

                menu.style.left =
                    `${posicao.right + window.scrollX - menu.offsetWidth}px`;

                // VER DETALHES
                menu
                    .querySelector('[data-acao="visualizar"]')
                    .addEventListener("click", () => {

                        window.location.href =
                            `./acompanhamento.html?id=${id}`;
                    });

                // EDITAR
                menu
                    .querySelector('[data-acao="editar"]')
                    .addEventListener("click", () => {

                        window.location.href =
                            `./acompanhamento-editar.html?id=${id}`;
                    });

                // EXCLUIR
                menu
                    .querySelector('[data-acao="excluir"]')
                    .addEventListener("click", async () => {

                        const confirmar = confirm(
                            "Tem certeza que deseja excluir este acompanhamento?"
                        );

                        if (!confirmar) {
                            return;
                        }

                        try {

                            const response = await fetch(
                                `${API_URL}/processos/${id}`,
                                {
                                    method: "DELETE"
                                }
                            );

                            if (!response.ok) {
                                throw new Error(
                                    `Erro HTTP ${response.status}`
                                );
                            }

                            alert(
                                "Acompanhamento excluído com sucesso."
                            );

                            window.location.reload();

                        } catch (erro) {

                            console.error(
                                "Erro ao excluir acompanhamento:",
                                erro
                            );

                            alert(
                                "Não foi possível excluir o acompanhamento."
                            );
                        }
                    });
            });
        });


    document
        .getElementById("contadorProcessos")
        .textContent =
        `${processos.length} processo(s) exibido(s)`;

}

document.addEventListener("click", () => {
    document
        .querySelectorAll(".action-menu")
        .forEach(menu => menu.remove());
});


function obterSituacao(processo) {

    const pendencias =
        processo.pendencias ?? [];


    if (pendencias.length === 0) {
        return "Sem pendência";
    }


    const possuiAberta =
        pendencias.some(
            (pendencia) =>
                pendencia.situacao === "Aberta"
        );


    return possuiAberta
        ? "Aberta"
        : "Atendida";

}


function obterCodigoRodovia(processo) {

    const trecho =
        processo.trechos?.[0];

    return (
        trecho?.rodovia?.rodCodigo ??
        trecho?.rodovia?.rodCodigo ??
        ""
    );

}


function obterDivisaoCap(processo) {

    const pendencia =
        (processo.pendencias ?? [])
            .find((item) => item.divisaoCap);

    return pendencia?.divisaoCap ?? "";

}


function obterAtribuicoes(processo) {

    const atribuicoes = new Set();


    (processo.pendencias ?? []).forEach(
        (pendencia) => {

            (pendencia.atribuidoA ?? [])
                .forEach((item) =>
                    atribuicoes.add(item)
                );

        }
    );


    return Array.from(atribuicoes);

}


function obterPrazo(processo) {

    const pendenciasAbertas =
        (processo.pendencias ?? [])
            .filter((pendencia) =>
                pendencia.situacao === "Aberta" &&
                pendencia.prazo
            );


    if (pendenciasAbertas.length === 0) {
        return "—";
    }


    pendenciasAbertas.sort(
        (a, b) =>
            new Date(a.prazo) -
            new Date(b.prazo)
    );


    return formatarData(
        pendenciasAbertas[0].prazo
    );

}


function formatarData(valor) {

    if (!valor) {
        return "—";
    }


    const data =
        new Date(valor);


    if (Number.isNaN(data.getTime())) {
        return "—";
    }


    return data.toLocaleDateString("pt-BR");

}


function preencherFiltros() {

    preencherSelect(
        "filtroTecnico",
        todosProcessos.flatMap((processo) =>
            String(processo.tecnicoResponsavel ?? "")
                .split(";")
                .map((nome) => nome.trim())
                .filter(Boolean)
        )
    );


    preencherSelect(
        "filtroClassificacao",
        [
            "SUP.OBRA",
            "OP-FAUNA",
            "OUTROS"
        ]
    );


    preencherSelect(
        "filtroDivisao",
        [
            "Supervisão obra",
            "Não Aplicável",
            "Meio Sócio",
            "Meio Físico",
            "Licenciamento",
            "INFRAÇÃO AMBIENTAL",
            "Flora",
            "Fauna",
            "Concessionária"
        ]
    );


    preencherSelect(
        "filtroRodovia",
        todosProcessos
            .map(obterCodigoRodovia)
    );

}


function preencherSelect(id, valores) {

    const select =
        document.getElementById(id);

    const valoresUnicos =
        [...new Set(
            valores.filter(Boolean)
        )]
        .sort((a, b) =>
            a.localeCompare(b, "pt-BR")
        );


    valoresUnicos.forEach((valor) => {

        const option =
            document.createElement("option");

        option.value = valor;
        option.textContent = valor;

        select.appendChild(option);

    });

}


function configurarBotoes() {

    const btnNovo =
        document.getElementById("btnNovoProcesso");

    const btnExportar =
        document.getElementById("btnExportar");

    const btnSair =
        document.getElementById("btnSair");


    btnNovo.addEventListener("click", () => {

        window.location.href =
            "./acompanhamento-novo.html";

    });


    btnExportar.addEventListener("click", () => {

        exportarCSV();

    });


    btnSair.addEventListener("click", () => {

        console.log("Sair");

    });

}

function configurarMultiselectTecnicos() {

    const multiselect =
        document.querySelector(
            ".tecnicos-multiselect"
        );

    if (!multiselect) {
        return;
    }


    const trigger =
        multiselect.querySelector(
            ".tecnicos-trigger"
        );

    const textoTrigger =
        multiselect.querySelector(
            ".tecnicos-trigger-text"
        );

    const dropdown =
        multiselect.querySelector(
            ".tecnicos-dropdown"
        );

    const lista =
        multiselect.querySelector(
            ".tecnicos-opcoes"
        );

    const selectOriginal =
        multiselect.querySelector(
            "#filtroTecnico"
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


    lista.innerHTML = "";


    function atualizarTexto() {

        const selecionados =
            Array.from(
                selectOriginal.selectedOptions
            )
            .filter(
                option => option.value !== ""
            )
            .map(
                option =>
                    option.textContent.trim()
            );


        if (selecionados.length === 0) {

            textoTrigger.textContent =
                "Todos os técnicos";

            return;
        }


        if (selecionados.length <= 2) {

            textoTrigger.textContent =
                selecionados.join(", ");

            return;
        }


        textoTrigger.textContent =
            `${selecionados.length} técnicos selecionados`;

    }


    Array.from(
        selectOriginal.options
    )
    .filter(
        option => option.value !== ""
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

        checkbox.type =
            "checkbox";

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


                const opcaoTodos =
                    selectOriginal
                        .querySelector(
                            'option[value=""]'
                        );

                if (opcaoTodos) {
                    opcaoTodos.selected =
                        false;
                }


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


    document.addEventListener(
        "click",
        (event) => {

            if (
                !multiselect.contains(
                    event.target
                )
            ) {

                dropdown.hidden = true;

                trigger.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    atualizarTexto();

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
                    optionSelecionada
                        ?.textContent
                        ?.trim()
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
                                    outroItem
                                        .classList
                                        .remove(
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
                                        ?.classList
                                        .remove(
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


async function exportarCSV() {

    if (processosExibidos.length === 0) {

        alert(
            "Não há acompanhamentos exibidos para exportar."
        );

        return;
    }


    try {

        // ==========================================
        // BUSCA O DETALHE COMPLETO SOMENTE DOS
        // ACOMPANHAMENTOS EXIBIDOS APÓS OS FILTROS
        // ==========================================

        const processosCompletos =
            await Promise.all(

                processosExibidos.map(
                    async (processo) => {

                        const response =
                            await fetch(
                                `${API_URL}/processos/${processo.id}`
                            );


                        if (!response.ok) {

                            throw new Error(
                                `Erro ao carregar ${processo.idEmpreendimento}`
                            );

                        }


                        return await response.json();

                    }
                )

            );


        const linhas = [];


        // ==========================================
        // CABEÇALHO
        // ==========================================

        linhas.push([
            "Nº Empreendimento",
            "Tipo de Empreendimento",
            "Classificação",
            "Identificação do Empreendimento",
            "Caracterização do Empreendimento",
            "Interessado",
            "Técnico Responsável",
            "Situação",
            "Histórico do Acompanhamento - Data",
            "Histórico do Acompanhamento",
            "Trechos",
            "Pendências",
            "Históricos das Pendências",
            "Histórico de Alterações"
        ]);


        // ==========================================
        // ACOMPANHAMENTOS
        // ==========================================

        for (
            const processo
            of processosCompletos
        ) {

            // ======================================
            // TRECHOS + SIRGEO
            // ======================================

            const trechosTexto = [];


            for (
                let trechoIndex = 0;
                trechoIndex < (processo.trechos ?? []).length;
                trechoIndex++
            ) {

                const trecho =
                    processo.trechos[trechoIndex];


                const rodovia =
                    trecho.rodovia?.rodCodigo ??
                    "";


                let denominacoes = [];
                let municipios = [];
                let regionais = [];


                if (
                    trecho.rodId &&
                    trecho.kmInicial != null &&
                    trecho.kmFinal != null
                ) {

                    try {

                        const responseSirgeo =
                            await fetch(
                                `${API_URL}/processos/rodovias/${trecho.rodId}/denominacoes` +
                                `?kmInicial=${encodeURIComponent(trecho.kmInicial)}` +
                                `&kmFinal=${encodeURIComponent(trecho.kmFinal)}`
                            );


                        if (responseSirgeo.ok) {

                            const dadosSirgeo =
                                await responseSirgeo.json();


                            denominacoes = [
                                ...new Set(
                                    dadosSirgeo
                                        .map(
                                            item =>
                                                item.denominacao
                                                    ?.trim()
                                        )
                                        .filter(Boolean)
                                )
                            ];


                            municipios = [
                                ...new Set(
                                    dadosSirgeo
                                        .map(
                                            item =>
                                                item.municipio
                                                    ?.trim()
                                        )
                                        .filter(Boolean)
                                )
                            ];


                            regionais = [
                                ...new Set(
                                    dadosSirgeo
                                        .filter(
                                            item =>
                                                item.codigoRegional &&
                                                item.regional
                                        )
                                        .map(
                                            item =>
                                                `${item.codigoRegional} - ${item.regional}`
                                        )
                                )
                            ];

                        }

                    }
                    catch (error) {

                        console.error(
                            "Erro ao carregar dados SIRGEO para CSV:",
                            error
                        );

                    }

                }


                trechosTexto.push(
                    [
                        `Trecho ${trechoIndex + 1}`,
                        `Rodovia: ${rodovia}`,
                        `KM Inicial: ${trecho.kmInicial ?? ""}`,
                        `KM Final: ${trecho.kmFinal ?? ""}`,
                        `Denominação: ${denominacoes.join(" / ")}`,
                        `Município: ${municipios.join(" / ")}`,
                        `Regional: ${regionais.join(" / ")}`
                    ].join(" | ")
                );

            }


            // ======================================
            // PENDÊNCIAS
            // ======================================

            const pendenciasTexto =
                (processo.pendencias ?? [])
                    .map(
                        (pendencia, index) => {

                            const atribuidoA =
                                Array.isArray(
                                    pendencia.atribuidoA
                                )
                                    ? pendencia.atribuidoA.join(", ")
                                    : "";


                            const regionais =
                                Array.isArray(
                                    pendencia.regionais
                                )
                                    ? pendencia.regionais.join(", ")
                                    : "";


                            return [
                                `Pendência ${index + 1}`,
                                `Descrição: ${pendencia.descricao ?? ""}`,
                                `Situação: ${pendencia.situacao ?? ""}`,
                                `Divisão CAP: ${pendencia.divisaoCap ?? ""}`,
                                `Atribuído a: ${atribuidoA}`,
                                `Regionais: ${regionais}`,
                                `Data de Entrada: ${formatarDataCsv(pendencia.dataEntrada)}`,
                                `Prazo: ${formatarDataCsv(pendencia.prazo)}`,
                                `Data de Saída: ${formatarDataCsv(pendencia.dataSaida)}`
                            ].join(" | ");

                        }
                    )
                    .join(" || ");


            // ======================================
            // HISTÓRICOS DAS PENDÊNCIAS
            // ======================================

            const historicosPendenciasTexto =
                (processo.pendencias ?? [])
                    .flatMap(
                        (pendencia, pendenciaIndex) =>

                            (pendencia.historicos ?? [])
                                .map(
                                    (historico, historicoIndex) =>

                                        [
                                            `Pendência ${pendenciaIndex + 1}`,
                                            `Histórico ${historicoIndex + 1}`,
                                            `Data: ${formatarDataCsv(historico.data)}`,
                                            `Texto: ${historico.texto ?? ""}`
                                        ].join(" | ")

                                )

                    )
                    .join(" || ");


            // ======================================
            // HISTÓRICO DE ALTERAÇÕES
            // ======================================

            const historicoAlteracoesTexto =
                (processo.historicosAlteracoes ?? [])
                    .map(
                        (historico) =>

                            [
                                `Data: ${formatarDataHoraCsv(historico.dataHora)}`,
                                `Usuário: ${historico.usuario ?? ""}`,
                                `Operação: ${historico.operacao ?? ""}`,
                                `Campo: ${historico.campo ?? ""}`,
                                `Anterior: ${historico.valorAnterior ?? ""}`,
                                `Novo: ${historico.valorNovo ?? ""}`
                            ].join(" | ")

                    )
                    .join(" || ");


            // ======================================
            // LINHA DO ACOMPANHAMENTO
            // ======================================

            linhas.push([

                processo.idEmpreendimento ?? "",

                processo.empreendimento ?? "",

                processo.classificacao ?? "",

                processo.identificacaoEmpreendimento ?? "",

                processo.caracterizacaoEmpreendimento ?? "",

                processo.interessado ?? "",

                processo.tecnicoResponsavel ?? "",

                obterSituacao(processo),

                formatarDataCsv(
                    processo.historicoProcessoData
                ),

                processo.historicoProcessoTexto ?? "",

                trechosTexto.join(" || "),

                pendenciasTexto,

                historicosPendenciasTexto,

                historicoAlteracoesTexto

            ]);

        }


        // ==========================================
        // GERA O CSV
        // ==========================================

        const csv =
            linhas
                .map(
                    linha =>
                        linha
                            .map(
                                valor =>
                                    `"${String(valor ?? "")
                                        .replaceAll('"', '""')}"`
                            )
                            .join(";")
                )
                .join("\n");


        const blob =
            new Blob(
                [
                    "\ufeff" +
                    csv
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        const data =
            new Date()
                .toLocaleDateString("pt-BR")
                .replaceAll("/", "-");


        link.href = url;

        link.download =
            `Acompanhamentos_Licenciamento_Ambiental_${data}.csv`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

        URL.revokeObjectURL(url);

    }
    catch (error) {

        console.error(
            "Erro ao exportar acompanhamentos:",
            error
        );


        alert(
            "Não foi possível exportar os acompanhamentos."
        );

    }

}

function formatarDataCsv(valor) {

    if (!valor) {
        return "";
    }


    const texto =
        String(valor);


    const dataIso =
        texto.substring(0, 10);


    const partes =
        dataIso.split("-");


    if (partes.length !== 3) {
        return texto;
    }


    const [
        ano,
        mes,
        dia
    ] = partes;


    return `${dia}/${mes}/${ano}`;

}


function formatarDataHoraCsv(valor) {

    if (!valor) {
        return "";
    }


    const data =
        new Date(valor);


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "";
    }


    return data.toLocaleString(
        "pt-BR"
    );

}


function classeSituacao(situacao) {

    switch (situacao) {

        case "Aberta":
            return "status-aberta";

        case "Atendida":
            return "status-atendida";

        default:
            return "status-sem-pendencia";

    }

}


function escapeHtml(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}