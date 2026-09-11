const API_URL = "http://localhost:5161/api";

let todosProcessos = [];


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

    const tecnico =
        document.getElementById("filtroTecnico").value;

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


        const correspondeTecnico =
            !tecnico ||
            processo.tecnicoResponsavel === tecnico;


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
        todosProcessos
            .map((p) => p.tecnicoResponsavel)
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


function exportarCSV() {

    const linhas = [
        [
            "Número do empreendimento",
            "Código",
            "Identificação",
            "Classificação",
            "Divisão CAP",
            "Técnico",
            "Situação"
        ]
    ];


    todosProcessos.forEach((processo) => {

        linhas.push([
            processo.idEmpreendimento ?? "",
            obterCodigoRodovia(processo),
            processo.identificacaoEmpreendimento ?? "",
            processo.classificacao ?? "",
            obterDivisaoCap(processo),
            processo.tecnicoResponsavel ?? "",
            obterSituacao(processo)
        ]);

    });


    const csv =
        linhas
            .map((linha) =>
                linha
                    .map((valor) =>
                        `"${String(valor)
                            .replaceAll('"', '""')}"`
                    )
                    .join(";")
            )
            .join("\n");


    const blob =
        new Blob(
            ["\ufeff" + csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");


    link.href = url;
    link.download = "processos.csv";

    link.click();

    URL.revokeObjectURL(url);

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