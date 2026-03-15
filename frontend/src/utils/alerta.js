import Swal from 'sweetalert2';

/**
 * Instancia global de SweetAlert2 con el tema MEI.
 * Usa las variables de diseño del sistema: #1C1C1C, #4A5568, #F8F8F7
 */
export const alerta = Swal.mixin({
    buttonsStyling: false,
    customClass: {
        popup:         'mei-swal-popup',
        title:         'mei-swal-titulo',
        htmlContainer: 'mei-swal-cuerpo',
        confirmButton: 'btn btn-peligro',
        cancelButton:  'btn btn-secundario',
        icon:          'mei-swal-icono',
    },
    reverseButtons: true,
    focusCancel: true,
});

/**
 * Diálogo de confirmación estándar para acciones destructivas.
 * @param {string} titulo  - Ej: '¿Desactivar producto?'
 * @param {string} texto   - Ej: 'El producto quedará inactivo en el sistema.'
 * @param {string} btnTexto - Texto del botón de confirmación
 */
export const confirmar = async (titulo, texto, btnTexto = 'Confirmar') => {
    const resultado = await alerta.fire({
        title: titulo,
        text: texto,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: btnTexto,
        cancelButtonText: 'Cancelar',
    });
    return resultado.isConfirmed;
};

/**
 * Diálogo de confirmación de eliminación (variante más intensa).
 */
export const confirmarEliminar = async (nombreEntidad) => {
    return confirmar(
        `¿Desactivar ${nombreEntidad}?`,
        'El registro quedará inactivo. Esta acción puede revertirse desde el panel de administración.',
        'Desactivar'
    );
};

/**
 * Alerta informativa simple.
 */
export const informar = (titulo, texto) =>
    alerta.fire({ title: titulo, text: texto, icon: 'info', confirmButtonText: 'Entendido' });
