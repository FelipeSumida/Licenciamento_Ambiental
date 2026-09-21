(() => {

    const autenticado =
        sessionStorage.getItem(
            "licenciamentoAutenticado"
        ) === "true";


    if (!autenticado) {

        window.location.replace(
            "./login.html"
        );

        return;
    }


    document.addEventListener(
        "DOMContentLoaded",
        () => {

            const btnSair =
                document.getElementById(
                    "btnSair"
                );


            if (btnSair) {

                btnSair.addEventListener(
                    "click",
                    () => {

                        sessionStorage.removeItem(
                            "licenciamentoAutenticado"
                        );

                        sessionStorage.removeItem(
                            "licenciamentoUsuario"
                        );


                        window.location.replace(
                            "./login.html"
                        );

                    }
                );

            }

        }
    );

})();