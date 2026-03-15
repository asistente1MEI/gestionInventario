import { useState } from 'react';

export const usePaginacion = (limitePorDefecto = 20) => {
    const [pagina, setPagina] = useState(1);
    const [limite] = useState(limitePorDefecto);

    const irAPagina = (nuevaPagina) => setPagina(nuevaPagina);
    const paginaSiguiente = (metadataPag) => {
        if (metadataPag?.hasNextPage) setPagina(p => p + 1);
    };
    const paginaAnterior = () => setPagina(p => Math.max(1, p - 1));
    const reiniciarPagina = () => setPagina(1);

    return { pagina, limite, irAPagina, paginaSiguiente, paginaAnterior, reiniciarPagina };
};
