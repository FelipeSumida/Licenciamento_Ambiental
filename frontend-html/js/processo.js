const API_URL = "http://localhost:5161/api";

document.addEventListener("DOMContentLoaded", () => {
    carregarProcesso();
});


async function carregarProcesso() {

    const params =
        new URLSearchParams(window.location.search);

    const id =
        params.get("id");


    if (!id) {
        mostrarErro();
        return;
    }


    try {

        const response =
            await fetch(`${API_URL}/processos/${id}`);


        if (!response.ok) {
            throw new Error(
                `Erro HTTP ${response.status}`
            );
        }


        const processo =
            await response.json();


        renderizarProcesso(processo);

    } catch (error) {

        console.error(
            "Erro ao carregar processo:",
            error
        );

        mostrarErro();

    }

}


function renderizarProcesso(processo) {

    document.getElementById("carregando").hidden = true;
    document.getElementById("conteudoProcesso").hidden = false;


    document.getElementById(
        "numeroEmpreendimento"
    ).textContent =
        processo.idEmpreendimento ?? "Sem número";

    document.getElementById(
        "pdfNumeroProcesso"
    ).textContent =
        processo.idEmpreendimento ?? "Sem número";


    document.getElementById(
        "empreendimento"
    ).textContent =
        processo.empreendimento || "—";


    document.getElementById(
        "identificacaoEmpreendimento"
    ).value =
        processo.identificacaoEmpreendimento || "—";

    document.getElementById(
        "caracterizacaoEmpreendimento"
    ).value =
        processo.caracterizacaoEmpreendimento || "—";

    document.getElementById(
        "interessado"
    ).textContent =
        processo.interessado || "—";


    const containerTecnicos =
        document.getElementById(
            "tecnicoResponsavel"
        );


    const tecnicos =
        String(
            processo.tecnicoResponsavel ?? ""
        )
            .split(";")
            .map(
                tecnico =>
                    tecnico.trim()
            )
            .filter(Boolean);


    containerTecnicos.innerHTML = "";


    if (tecnicos.length === 0) {

        containerTecnicos.textContent = "—";

    }
    else {

        tecnicos.forEach(
            tecnico => {

                const item =
                    document.createElement("div");

                item.className =
                    "tecnico-visual-item";

                item.innerHTML = `
                    <span class="tecnico-visual-ponto"></span>

                    <span>
                        ${escapeHtml(tecnico)}
                    </span>
                `;

                containerTecnicos.appendChild(
                    item
                );

            }
        );

    }


    const situacao =
        obterSituacao(processo);


    const badge =
        document.getElementById("situacaoProcesso");

    badge.textContent = situacao;

    badge.classList.add(
        classeSituacao(situacao)
    );


    renderizarTrechos(
        processo.trechos ?? []
    );


    renderizarPendencias(
        processo.pendencias ?? [],
        processo.trechos ?? []
    );

    renderizarPrazos(
        processo.pendencias ?? []
    );

    renderizarHistoricoProcesso(processo);

    renderizarHistoricoAlteracoes(
        processo.historicosAlteracoes ?? []
    );



    configurarBotoes(processo);

}


function renderizarTrechos(trechos) {

    const container =
        document.getElementById("listaTrechos");

    container.innerHTML = "";


    if (trechos.length === 0) {

        container.innerHTML =
            '<p class="muted-text">Nenhum trecho registrado.</p>';

        return;

    }


    trechos.forEach((trecho, trechoIndex) => {

        const bloco =
            document.createElement("div");

        bloco.className = "trecho-card";


        const codigo =
            trecho.rodovia?.rodCodigo ?? "—";


        const fases =
            [...(trecho.fases ?? [])]
                .sort(
                    (a, b) =>
                        Number(a.ordem ?? 0) -
                        Number(b.ordem ?? 0)
                );


        const fasesComplementares =
            Array.isArray(trecho.fasesComplementares)
                ? trecho.fasesComplementares
                : [];


        bloco.innerHTML = `

            <h3>
                Trecho ${trechoIndex + 1}
            </h3>


            <div class="detail-grid trecho-info">

                <div>
                    <span class="detail-label">
                        RODOVIA
                    </span>

                    <strong>
                        ${escapeHtml(codigo)}
                    </strong>
                </div>


                <div>
                    <span class="detail-label">
                        KM INICIAL
                    </span>

                    <strong>
                        ${escapeHtml(
                            trecho.kmInicial ?? "—"
                        )}
                    </strong>
                </div>


                <div>
                    <span class="detail-label">
                        KM FINAL
                    </span>

                    <strong>
                        ${escapeHtml(
                            trecho.kmFinal ?? "—"
                        )}
                    </strong>
                </div>

            </div>

            <div class="trecho-sirgeo-info">

                <div class="trecho-denominacao">

                    <span class="detail-label">
                        DENOMINAÇÃO
                    </span>

                    <p class="trecho-denominacao-valor">
                        Carregando...
                    </p>

                </div>


                <div class="trecho-sirgeo-grid">

                    <div class="trecho-sirgeo-box">

                        <span class="detail-label">
                            MUNICÍPIO
                        </span>

                        <div class="trecho-municipios">
                            Carregando...
                        </div>

                    </div>


                    <div class="trecho-sirgeo-box">

                        <span class="detail-label">
                            REGIONAL
                        </span>

                        <div class="trecho-regionais">
                            Carregando...
                        </div>

                    </div>

                </div>

            </div>


            <div class="fases-container">

                <h4>
                    Fases do trecho
                </h4>


                ${
                    fases.length === 0

                        ? `
                            <p class="muted-text">
                                Nenhuma fase registrada.
                            </p>
                        `

                        : fases
                            .map(
                                (fase, index) => `

                                    <div class="fase-card">

                                        <strong>
                                            Fase ${index + 1}
                                        </strong>


                                        <div class="detail-grid">

                                            <div>
                                                <span class="detail-label">
                                                    FASE
                                                </span>

                                                <p>
                                                    ${escapeHtml(fase.fase ?? "—")}
                                                </p>
                                            </div>


                                            <div>
                                                <span class="detail-label">
                                                    NÚMERO DO PROCESSO
                                                </span>

                                                <p>
                                                    ${escapeHtml(fase.numeroProcesso ?? "—")}
                                                </p>
                                            </div>

                                            <div>
                                                <span class="detail-label">
                                                    Nº DO LICENCIAMENTO
                                                </span>

                                                <p>
                                                    ${escapeHtml(
                                                        fase.numeroLicenciamento ?? "—"
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <span class="detail-label">
                                                    SITUAÇÃO DA FASE
                                                </span>

                                                <p>
                                                    ${escapeHtml(fase.statusFase ?? "—")}
                                                </p>
                                            </div>


                                            ${
                                                fase.statusFase !== "Em andamento" &&
                                                fase.statusFase !== "Dispensado"
                                                    ? `
                                                        <div>
                                                            <span class="detail-label">
                                                                Nº
                                                            </span>

                                                            <p>
                                                                ${escapeHtml(fase.numeroFase ?? "—")}
                                                            </p>
                                                        </div>


                                                        <div>
                                                            <span class="detail-label">
                                                                DATA DE EMISSÃO
                                                            </span>

                                                            <p>
                                                                ${
                                                                    fase.dataEmissaoFase
                                                                        ? formatarData(fase.dataEmissaoFase)
                                                                        : "—"
                                                                }
                                                            </p>
                                                        </div>


                                                        <div>
                                                            <span class="detail-label">
                                                                DATA DE VALIDADE
                                                            </span>

                                                            <p>
                                                                ${
                                                                    fase.dataValidadeFase
                                                                        ? formatarData(fase.dataValidadeFase)
                                                                        : "—"
                                                                }
                                                            </p>
                                                        </div>
                                                    `
                                                    : ""
                                            }

                                        </div>

                                    </div>
                                `
                            )
                            .join("")
                }

            </div>


            <div class="fases-complementares-visual">

                <h4>
                    Fases Complementares
                </h4>


                ${
                    fasesComplementares.length === 0

                        ? `
                            <p class="muted-text">
                                Nenhuma fase complementar registrada.
                            </p>
                        `

                        : `
                            <div class="fases-complementares-lista">

                                ${fasesComplementares
                                    .map(
                                        (
                                            faseComplementar,
                                            complementarIndex
                                        ) => `

                                            <div class="fase-complementar-visual-card">

                                                <div class="fase-complementar-visual-header">

                                                    <strong>
                                                        Fase Complementar ${complementarIndex + 1}
                                                    </strong>

                                                </div>


                                                <div class="detail-grid">

                                                    <div>

                                                        <span class="detail-label">
                                                            FASE
                                                        </span>

                                                        <p>
                                                            ${escapeHtml(
                                                                faseComplementar.fase ?? "—"
                                                            )}
                                                        </p>

                                                    </div>


                                                    <div>

                                                        <span class="detail-label">
                                                            DATA DE EMISSÃO
                                                        </span>

                                                        <p>
                                                            ${
                                                                faseComplementar.dataEmissao
                                                                    ? formatarData(
                                                                        faseComplementar.dataEmissao
                                                                    )
                                                                    : "—"
                                                            }
                                                        </p>

                                                    </div>


                                                    <div>

                                                        <span class="detail-label">
                                                            ANEXO
                                                        </span>

                                                        ${
                                                            faseComplementar.anexoPdf

                                                                ? `
                                                                    <a
                                                                        class="fase-complementar-anexo-link"
                                                                        href="${API_URL}/processos/fases-complementares/${faseComplementar.id}/anexo"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <i
                                                                            data-lucide="paperclip"
                                                                            class="fase-complementar-anexo-icon"
                                                                        ></i>

                                                                        ${escapeHtml(faseComplementar.anexoPdf)}
                                                                    </a>
                                                                `

                                                                : `
                                                                    <p class="muted-text">
                                                                        Sem anexo
                                                                    </p>
                                                                `
                                                        }

                                                    </div>

                                                </div>

                                            </div>

                                        `
                                    )
                                    .join("")}

                            </div>
                        `
                }

            </div>

        `;


        container.appendChild(bloco);

        carregarDadosSirgeoTrecho(
            trecho,
            bloco
        );

    });

    if (window.lucide) {
        lucide.createIcons();
    }

}

async function carregarDadosSirgeoTrecho(
    trecho,
    bloco
) {

    const rodId =
        trecho.rodId ??
        trecho.rodovia?.rodId;


    const area =
        bloco.querySelector(
            ".trecho-sirgeo-info"
        );


    if (
        !area ||
        !rodId ||
        trecho.kmInicial == null ||
        trecho.kmFinal == null
    ) {

        if (area) {
            area.hidden = true;
        }

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/processos/rodovias/${rodId}/denominacoes` +
                `?kmInicial=${encodeURIComponent(trecho.kmInicial)}` +
                `&kmFinal=${encodeURIComponent(trecho.kmFinal)}`
            );


        if (!response.ok) {

            throw new Error(
                `Erro HTTP ${response.status}`
            );

        }


        const dados =
            await response.json();


        const denominacoes =
            [
                ...new Set(
                    dados
                        .map(
                            item =>
                                item.denominacao
                                    ?.trim()
                        )
                        .filter(Boolean)
                )
            ];


        const municipios =
            [
                ...new Set(
                    dados
                        .map(
                            item =>
                                item.municipio
                                    ?.trim()
                        )
                        .filter(Boolean)
                )
            ];


        const regionais =
            [
                ...new Set(
                    dados
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


        const denominacaoElemento =
            bloco.querySelector(
                ".trecho-denominacao-valor"
            );

        const municipiosElemento =
            bloco.querySelector(
                ".trecho-municipios"
            );

        const regionaisElemento =
            bloco.querySelector(
                ".trecho-regionais"
            );


        denominacaoElemento.textContent =
            denominacoes.length > 0
                ? denominacoes.join(" · ")
                : "—";


        municipiosElemento.textContent =
            municipios.length > 0
                ? municipios.join(" · ")
                : "—";


        regionaisElemento.innerHTML =
            regionais.length > 0
                ? regionais
                    .map(
                        regional => `
                            <div>
                                ${escapeHtml(regional)}
                            </div>
                        `
                    )
                    .join("")
                : "—";

    }
    catch (error) {

        console.error(
            "Erro ao carregar dados SIRGEO do trecho:",
            error
        );


        const denominacaoElemento =
            bloco.querySelector(
                ".trecho-denominacao-valor"
            );

        const municipiosElemento =
            bloco.querySelector(
                ".trecho-municipios"
            );

        const regionaisElemento =
            bloco.querySelector(
                ".trecho-regionais"
            );


        if (denominacaoElemento) {
            denominacaoElemento.textContent = "—";
        }

        if (municipiosElemento) {
            municipiosElemento.textContent = "—";
        }

        if (regionaisElemento) {
            regionaisElemento.textContent = "—";
        }

    }

}


function renderizarPendencias(pendencias, trechos = []) {

    const container =
        document.getElementById("listaPendencias");

    container.innerHTML = "";


    if (pendencias.length === 0) {

        container.innerHTML =
            '<p class="muted-text">Sem pendências registradas.</p>';

        return;
    }


    pendencias.forEach((pendencia, index) => {

        const bloco =
            document.createElement("div");

        bloco.className =
            "pendencia-card pendencia-card-visual";


        const historicos =
            Array.isArray(pendencia.historicos)
                ? pendencia.historicos
                : [];


        const atribuidoA =
            Array.isArray(pendencia.atribuidoA)
                ? pendencia.atribuidoA
                : pendencia.atribuidoA
                    ? [pendencia.atribuidoA]
                    : [];


        const regionais =
            Array.isArray(pendencia.regionais)
                ? pendencia.regionais
                : [];


        const situacao =
            pendencia.situacao || "—";


        const classeStatus =
            situacao === "Aberta"
                ? "pendencia-badge-aberta"
                : situacao === "Atendida"
                    ? "pendencia-badge-atendida"
                    : "pendencia-badge-neutra";

        const faseVinculada =
            obterFaseVinculadaTexto(
                pendencia.faseTrechoId ??
                pendencia.faseVinculadaRef,
                trechos
            );


        bloco.innerHTML = `

            <div class="pendencia-visual-header">

                <div>
                    <span class="pendencia-numero">
                        Pendência ${index + 1}
                    </span>
                </div>

                <span class="pendencia-status-badge ${classeStatus}">
                    ${escapeHtml(situacao)}
                </span>

            </div>


            <div class="pendencia-descricao-bloco">

                <span class="detail-label">
                    DESCRIÇÃO
                </span>

                <p class="pendencia-descricao-texto">
                    ${escapeHtml(
                        pendencia.descricao || "Sem descrição"
                    )}
                </p>

            </div>


            <div class="pendencia-informacoes-grid">

                <div class="pendencia-info-item">

                    <span class="detail-label">
                        DIVISÃO CAP
                    </span>

                    <strong>
                        ${escapeHtml(
                            pendencia.divisaoCap || "—"
                        )}
                    </strong>

                </div>

                <div class="pendencia-info-item">

                    <span class="detail-label">
                        FASE VINCULADA
                    </span>

                    <strong>
                        ${escapeHtml(faseVinculada)}
                    </strong>

                </div>


                <div class="pendencia-info-item">

                    <span class="detail-label">
                        ATRIBUÍDO A
                    </span>

                    <strong>
                        ${
                            atribuidoA.length > 0
                                ? escapeHtml(
                                    atribuidoA.join(", ")
                                )
                                : "—"
                        }
                    </strong>

                </div>


                ${
                    regionais.length > 0
                        ? `
                            <div class="pendencia-info-item">

                                <span class="detail-label">
                                    REGIONAIS
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        regionais.join(", ")
                                    )}
                                </strong>

                            </div>
                        `
                        : ""
                }

            </div>


            <div class="historico-pendencia historico-pendencia-visual">

                <div class="historico-pendencia-titulo">

                    <h4>
                        Histórico da pendência
                    </h4>

                    ${
                        historicos.length > 0
                            ? `
                                <span class="historico-contador">
                                    ${historicos.length}
                                    ${
                                        historicos.length === 1
                                            ? "registro"
                                            : "registros"
                                    }
                                </span>
                            `
                            : ""
                    }

                </div>


                ${
                    historicos.length === 0

                        ? `
                            <p class="muted-text">
                                Nenhum histórico registrado.
                            </p>
                        `

                        : `
                            <div class="historico-pendencia-lista">

                                ${historicos
                                    .map(
                                        (
                                            historico,
                                            historicoIndex
                                        ) => `

                                            <div class="historico-visual-item">

                                                <div class="historico-visual-header">

                                                    <strong>
                                                        Histórico ${historicoIndex + 1}
                                                    </strong>

                                                    <span class="historico-visual-data">
                                                        ${
                                                            historico.data
                                                                ? formatarData(
                                                                    historico.data
                                                                )
                                                                : "—"
                                                        }
                                                    </span>

                                                </div>


                                                <p class="historico-visual-texto">
                                                    ${escapeHtml(
                                                        historico.texto || "—"
                                                    )}
                                                </p>

                                            </div>

                                        `
                                    )
                                    .join("")}

                            </div>
                        `
                }

            </div>

        `;


        container.appendChild(bloco);

    });

}

function obterFaseVinculadaTexto(
    faseTrechoId,
    trechos
) {

    if (!faseTrechoId) {
        return "—";
    }


    for (
        let trechoIndex = 0;
        trechoIndex < trechos.length;
        trechoIndex++
    ) {

        const trecho =
            trechos[trechoIndex];

        const fases =
            trecho.fases ?? [];


        const faseEncontrada =
            fases.find(
                fase =>
                    Number(fase.id) ===
                    Number(faseTrechoId)
            );


        if (faseEncontrada) {

            return (
                `Trecho ${trechoIndex + 1} - ` +
                `${faseEncontrada.fase || "—"}`
            );

        }

    }


    return "—";
}

function renderizarHistoricoProcesso(processo) {

    const container =
        document.getElementById("historicoProcesso");

    if (!container) {
        return;
    }

    const data =
        processo.historicoProcessoData;

    const texto =
        processo.historicoProcessoTexto;

    if (!data && !texto) {

        container.innerHTML = `
            <p class="muted-text">
                Nenhum histórico do processo registrado.
            </p>
        `;

        return;
    }

    container.innerHTML = `
        <div class="detail-grid">

            <div>
                <span class="detail-label">
                    DATA
                </span>

                <p>
                    ${data ? formatarData(data) : "—"}
                </p>
            </div>

            <div>
                <span class="detail-label">
                    HISTÓRICO
                </span>

                <p>
                    ${escapeHtml(texto || "—")}
                </p>
            </div>

        </div>
    `;
}

function formatarValorAlteracao(valor) {

    if (!valor || valor === "—") {
        return `<span class="alteracao-vazio">—</span>`;
    }

    const itens = String(valor)
        .split(";")
        .map(item => item.trim())
        .filter(Boolean);

    if (itens.length === 0) {
        return `<span class="alteracao-vazio">—</span>`;
    }

    return `
        <div class="alteracao-lista">
            ${itens.map(item => `
                <span class="alteracao-lista-item">
                    <span class="alteracao-bolinha"></span>
                    <span>${item}</span>
                </span>
            `).join("")}
        </div>
    `;
}

function renderizarHistoricoAlteracoes(historicos) {

    const container =
        document.getElementById(
            "historicoAlteracoes"
        );

    const contador =
        document.getElementById(
            "historicoAlteracoesContador"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (contador) {

        contador.textContent =
            historicos.length > 0
                ? `${historicos.length} ${
                    historicos.length === 1
                        ? "registro"
                        : "registros"
                }`
                : "";

    }


    if (historicos.length === 0) {

        container.innerHTML = `
            <p class="muted-text">
                Nenhuma alteração registrada.
            </p>
        `;

        return;
    }


    const ordenados =
        [...historicos].sort(
            (a, b) =>
                new Date(b.dataHora) -
                new Date(a.dataHora)
        );


    ordenados.forEach((historico) => {

        const bloco =
            document.createElement("div");

        bloco.className =
            "alteracao-item";


        const anterior =
            historico.valorAnterior ||
            "—";

        const novo =
            historico.valorNovo ||
            "—";


        bloco.innerHTML = `

            <div class="alteracao-linha-principal">

                <div class="alteracao-identificacao">

                    <strong class="alteracao-campo">
                        ${escapeHtml(
                            historico.campo ||
                            "Alteração"
                        )}
                    </strong>

                    <span class="alteracao-operacao">
                        ${escapeHtml(
                            historico.operacao ||
                            "Alteração"
                        )}
                    </span>

                </div>


                <span class="alteracao-data">
                    ${
                        historico.dataHora
                            ? formatarDataHora(
                                historico.dataHora
                            )
                            : "—"
                    }
                </span>

            </div>


            <div class="alteracao-linha-valores">

                <div class="alteracao-valor">

                    ${
                        historico.campo === "Técnico responsável"
                            ? formatarValorAlteracao(anterior)
                            : `<span class="alteracao-texto-anterior">
                                ${escapeHtml(anterior)}
                            </span>`
                    }

                    <span class="alteracao-seta">
                        →
                    </span>

                    ${
                        historico.campo === "Técnico responsável"
                            ? formatarValorAlteracao(novo)
                            : `<span class="alteracao-texto-novo">
                                ${escapeHtml(novo)}
                            </span>`
                    }

                </div>


                <span class="alteracao-usuario">
                    ${escapeHtml(
                        historico.usuario ||
                        "—"
                    )}
                </span>

            </div>

        `;


        container.appendChild(bloco);

    });

}


function renderizarPrazos(pendencias) {

    const container =
        document.getElementById("listaPrazos");

    container.innerHTML = "";


    if (pendencias.length === 0) {

        container.innerHTML =
            '<p class="muted-text">Sem prazos registrados.</p>';

        return;

    }


    pendencias.forEach((pendencia, index) => {

        const bloco =
            document.createElement("div");

        bloco.className = "prazo-item";


        bloco.innerHTML = `
            <strong>
                Pendência ${index + 1}
            </strong>

            <span class="detail-label">
                DATA DE ENTRADA
            </span>

            <p>
                ${formatarData(pendencia.dataEntrada)}
            </p>

            <span class="detail-label">
                PRAZO
            </span>

            <p>
                ${formatarData(pendencia.prazo)}
            </p>

            <span class="detail-label">
                DATA DE SAÍDA
            </span>

            <p>
                ${formatarData(pendencia.dataSaida)}
            </p>
        `;


        container.appendChild(bloco);

    });

}


function configurarBotoes(processo) {

    document
        .getElementById("btnEditar")
        .addEventListener("click", () => {

            window.location.href =
                `./processo-editar.html?id=${processo.id}`;

        });


    document
        .getElementById("btnPdf")
        .addEventListener("click", () => {

            const tituloAnterior =
                document.title;

            const numeroProcesso =
                processo.idEmpreendimento ||
                "processo";

            document.title =
                `Processo_${numeroProcesso}_Licenciamento_Ambiental`;

            const dataGeracao =
                document.getElementById(
                    "pdfDataGeracao"
                );

            if (dataGeracao) {

                dataGeracao.textContent =
                    new Date().toLocaleDateString(
                        "pt-BR"
                    );

            }

            const textareas =
                document.querySelectorAll(
                    ".dados-processo-texto-scroll"
                );


            textareas.forEach(
                (textarea) => {

                    textarea.dataset.alturaAnterior =
                        textarea.style.height;

                    textarea.style.height =
                        "auto";

                    textarea.style.height =
                        `${textarea.scrollHeight}px`;

                }
            );

            window.print();

            textareas.forEach(
                (textarea) => {

                    textarea.style.height =
                        textarea.dataset
                            .alturaAnterior || "";

                    delete textarea.dataset
                        .alturaAnterior;

                }
            );


            document.title =
                tituloAnterior;

        });

}


function obterSituacao(processo) {

    const pendencias =
        processo.pendencias ?? [];


    if (pendencias.length === 0) {
        return "Sem pendência";
    }


    return pendencias.some(
        (p) => p.situacao === "Aberta"
    )
        ? "Aberta"
        : "Atendida";

}


function classeSituacao(situacao) {

    if (situacao === "Aberta") {
        return "status-aberta";
    }

    if (situacao === "Atendida") {
        return "status-atendida";
    }

    return "status-sem-pendencia";

}


function formatarData(valor) {

    if (!valor) {
        return "—";
    }

    const texto =
        String(valor).trim();

    const dataTexto =
        texto.split("T")[0];

    const partes =
        dataTexto.match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

    if (partes) {

        const ano = partes[1];
        const mes = partes[2];
        const dia = partes[3];

        return `${dia}/${mes}/${ano}`;
    }

    return "—";
}

function formatarDataHora(valor) {

    if (!valor) {
        return "—";
    }


    const data =
        new Date(valor);


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "—";
    }


    return data.toLocaleString(
        "pt-BR"
    );

}


function mostrarErro() {

    document.getElementById("carregando").hidden = true;
    document.getElementById("erroProcesso").hidden = false;

}


function escapeHtml(valor) {

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}