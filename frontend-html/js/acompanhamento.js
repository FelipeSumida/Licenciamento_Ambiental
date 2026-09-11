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
        "empreendimento"
    ).textContent =
        processo.empreendimento || "—";
    

    document.getElementById(
        "classificacao"
    ).textContent =
        processo.classificacao || "—";


    document.getElementById(
        "identificacaoEmpreendimento"
    ).textContent =
        processo.identificacaoEmpreendimento || "—";


    document.getElementById(
        "caracterizacaoEmpreendimento"
    ).textContent =
        processo.caracterizacaoEmpreendimento || "—";


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
        processo.pendencias ?? []
    );

    renderizarPrazos(
        processo.pendencias ?? []
    );

    renderizarHistoricoProcesso(processo);


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


        bloco.innerHTML = `
            <h3>Trecho ${trechoIndex + 1}</h3>

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
                        ${escapeHtml(trecho.kmInicial ?? "—")}
                    </strong>
                </div>

                <div>
                    <span class="detail-label">
                        KM FINAL
                    </span>

                    <strong>
                        ${escapeHtml(trecho.kmFinal ?? "—")}
                    </strong>
                </div>

            </div>
        `;


        container.appendChild(bloco);

    });

}


function renderizarPendencias(pendencias) {

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

function renderizarHistoricoProcesso(processo) {

    const container =
        document.getElementById("historicoProcesso");

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
        <div class="historico-card">

            <div class="detail-grid">

                <div>
                    <span class="detail-label">
                        DATA
                    </span>

                    <p>
                        ${
                            data
                                ? formatarData(data)
                                : "—"
                        }
                    </p>
                </div>

                <div>
                    <span class="detail-label">
                        HISTÓRICO
                    </span>

                    <p>
                        ${
                            escapeHtml(
                                texto || "—"
                            )
                        }
                    </p>
                </div>

            </div>

        </div>
    `;
}


function configurarBotoes(processo) {

    document
        .getElementById("btnEditar")
        .addEventListener("click", () => {

            window.location.href =
                `./acompanhamento-editar.html?id=${processo.id}`;

        });


    document
        .getElementById("btnPdf")
        .addEventListener("click", () => {

            window.print();

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

    const correspondencia =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );

    if (!correspondencia) {
        return "—";
    }

    const ano = correspondencia[1];
    const mes = correspondencia[2];
    const dia = correspondencia[3];

    return `${dia}/${mes}/${ano}`;
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